from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import joblib
import numpy as np
from dotenv import load_dotenv
import re
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain
from langchain.tools import Tool
from langchain.agents import initialize_agent, AgentType

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")  # make your .env folder and paste your api key there

# Load the pretrained ML Models
diabetes_model = joblib.load("diabetes.pkl")
heart_model = joblib.load("heart_disease.pkl")
anemia_model = joblib.load("anemia.pkl")

#Function for model prediction
def diabetes_predictor(input_features: str) -> str:
    try:
        features = np.array(eval(input_features)).reshape(1, -1)
        prediction = diabetes_model.predict(features)[0]
        return "High risk of Diabetes." if prediction == 1 else "Low risk of Diabetes."
    except Exception as e:
        return f"Error in Diabetes Prediction: {str(e)}"

def heart_predictor(input_features: str) -> str:
    try:
        features = eval(input_features)
        if isinstance(features[1], str):
            gender_str = features[1].lower()
            if gender_str == "male":
                features[1] = 1
            elif gender_str == "female":
                features[1] = 0
        features_array = np.array(features).reshape(1, -1)
        prediction = heart_model.predict(features_array)[0]
        return "High risk of Heart Disease." if prediction == 1 else "Low risk of Heart Disease."
    except Exception as e:
        return f"Error in Heart Disease Prediction: {str(e)}"

def anemia_predictor(input_features: str) -> str:
    try:
        features = eval(input_features)
        if isinstance(features[0], str):
            gender_str = features[0].lower()
            features[0] = 1 if gender_str == "male" else 0
        features_array = np.array(features).reshape(1, -1)
        prediction = anemia_model.predict(features_array)[0]
        return "High risk of Anemia." if prediction == 1 else "Low risk of Anemia."
    except Exception as e:
        return f"Error in Anemia Prediction: {str(e)}"

tools = [
    Tool.from_function(diabetes_predictor, name="diabetes_predictor", description="Diabetes risk prediction"),
    Tool.from_function(heart_predictor, name="heart_disease_predictor", description="Heart disease risk prediction"),
    Tool.from_function(anemia_predictor, name="anemia_predictor", description="Anemia risk prediction"),
]

# Initializing the llm 

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.3,
    max_output_tokens=1024,
)

vector_store = None
retriever = None
rag_chain = None
agent = None

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    global vector_store, retriever, rag_chain, agent

    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as f:
        f.write(await file.read())

    loader = PyPDFLoader(temp_file_path)
    documents = loader.load()
    os.remove(temp_file_path)

    #Extract full text content for frontend
    extracted_text = "\n".join([doc.page_content for doc in documents])

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_documents(documents)

    embedding_model = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    vector_store = Chroma.from_documents(chunks, embedding_model)
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})

    prompt_template = PromptTemplate(
        input_variables=["context", "input"],
        template="""You are a medical assistant. Explain the following in simple, patient-friendly languageand if the question is not related to the context just say i don't know

Context:
{context}

Question:
{input}

Answer:
"""



    )

    document_chain = create_stuff_documents_chain(llm=llm, prompt=prompt_template)
    rag_chain = create_retrieval_chain(retriever=retriever, combine_docs_chain=document_chain)

    agent = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.OPENAI_FUNCTIONS,
        verbose=True,
    )

    return {"message": "PDF uploaded and processed successfully.", "extracted_text": extracted_text}

class ChatRequest(BaseModel):
    pdf_content: str
    user_message: str

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        if rag_chain is None or agent is None:
            return {"assistant_reply": "Please upload a PDF first before chatting."}

        user_msg = req.user_message.lower()

        disease_feature_names = {
            "diabetes": ["Pregnancies", "Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"],
            "heart disease": ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"],
            "anemia": ["Gender", "Hemoglobin", "MCH", "MCHC", "MCV"]
        }

        if "summarize" in user_msg:
            response = rag_chain.invoke({"input": "Summarize the medical report in simple language for the patient."})
            return {"assistant_reply": response["answer"]}

        elif any(disease in user_msg for disease in ["diabetes", "heart", "anemia"]):
            if "diabetes" in user_msg:
                disease = "diabetes"
                required_features = "[Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age]"
            elif "heart" in user_msg:
                disease = "heart disease"
                required_features = "[age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal]"
            elif "anemia" in user_msg:
                disease = "anemia"
                required_features = "[Gender, Hemoglobin, MCH, MCHC, MCV]"

            extraction_prompt = PromptTemplate(
                input_variables=["context"],
                template=f"""
From the medical report below, extract the following numeric features for {disease} model:

{required_features}

Output only a Python list like: [value1, value2, ...]

Context:
{{context}}
"""
            )

            docs = retriever.invoke(f"{disease} patient details")
            context_text = "\n".join([doc.page_content for doc in docs])

            formatted_prompt = extraction_prompt.format(context=context_text)
            extracted_features = llm.invoke(formatted_prompt).content

            match = re.search(r'\[.*?\]', extracted_features, re.DOTALL)
            features_list = match.group() if match else ""

            if not features_list:
                return {"assistant_reply": f"❌ Error: Failed to extract features for {disease}. LLM Output: {extracted_features}"}

            # Run ML Prediction
            if "diabetes" in disease:
                result = diabetes_predictor(features_list)
            elif "heart" in disease:
                result = heart_predictor(features_list)
            elif "anemia" in disease:
                result = anemia_predictor(features_list)
            else:
                result = "Disease model not found."

            #Map features to names for LLM explanation
            try:
                feature_labels = disease_feature_names[disease]
                feature_values = eval(features_list)
                feature_detail_lines = "\n".join(
                    f"{name}: {value}" for name, value in zip(feature_labels, feature_values)
                )
            except Exception as fe:
                feature_detail_lines = f"Features: {features_list}"

            explanation_prompt = f"""
Here is the patient's medical data for {disease}:

{feature_detail_lines}

ML Model Prediction: {result}

Now explain this result in very simple, patient-friendly, and empathetic language.  
Include what each feature represents, how it contributed, and suggest next steps.
"""
            final_answer = llm.invoke(explanation_prompt).content
            return {"assistant_reply": final_answer}

        else:
            response = agent.invoke({"input": req.user_message})
            return {"assistant_reply": response["output"]}

    except Exception as e:
        return {"assistant_reply": f"Server Error: {str(e)}"}
