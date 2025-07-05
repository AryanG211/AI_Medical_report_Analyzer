// "use client"

// import type React from "react"
// import { useState, useRef } from "react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Upload, FileText, MessageSquare, Send, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
// import Link from "next/link"

// type Message = {
//   id: string
//   role: "user" | "assistant"
//   content: string
// }

// export default function ChatPage() {
//   const [pdfUploaded, setPdfUploaded] = useState(false)
//   const [pdfContent, setPdfContent] = useState("")
//   const [isUploading, setIsUploading] = useState(false)
//   const [fileName, setFileName] = useState("")
//   const [messages, setMessages] = useState<Message[]>([])
//   const [input, setInput] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const fileInputRef = useRef<HTMLInputElement>(null)

//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0]
//     if (!file || file.type !== "application/pdf") {
//       alert("Please upload a PDF file")
//       return
//     }

//     setIsUploading(true)
//     setFileName(file.name)

//     try {
//       const formData = new FormData()
//       formData.append("file", file)

//       const response = await fetch("http://localhost:8000/upload-pdf", {
//         method: "POST",
//         body: formData,
//       })

//       if (!response.ok) {
//         throw new Error("Failed to upload PDF")
//       }

//       const data = await response.json()
//       const extractedText = data.extracted_text

//       setPdfContent(extractedText)
//       setPdfUploaded(true)

//       setMessages([
//         {
//           id: "system-initial",
//           role: "assistant",
//           content: `I've analyzed your health report "${file.name}". I'm ready to help you understand your results and answer any questions you may have about your health data. What would you like to know?`,
//         },
//       ])
//     } catch (error) {
//       console.error("Error uploading PDF:", error)
//       alert("Error processing PDF. Please try again.")
//     } finally {
//       setIsUploading(false)
//     }
//   }

//   const handleChatSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!input.trim()) return

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       role: "user",
//       content: input,
//     }

//     setMessages((prev) => [...prev, userMessage])
//     setIsLoading(true)
//     setInput("")

//     try {
//       const response = await fetch("http://localhost:8000/chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           pdf_content: pdfContent,
//           user_message: userMessage.content,
//         }),
//       })

//       if (!response.ok) {
//         throw new Error("Failed to get AI response")
//       }

//       const data = await response.json()
//       const assistantReply: Message = {
//         id: Date.now().toString() + "-assistant",
//         role: "assistant",
//         content: data.assistant_reply,
//       }

//       setMessages((prev) => [...prev, assistantReply])
//     } catch (error) {
//       console.error("Chat error:", error)
//       alert("Error during chat. Please try again.")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const resetUpload = () => {
//     setPdfUploaded(false)
//     setPdfContent("")
//     setFileName("")
//     setMessages([])
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ""
//     }
//   }

//   if (!pdfUploaded) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
//         <header className="border-b bg-white/80 backdrop-blur-sm">
//           <div className="container mx-auto px-4 py-4 flex items-center justify-between">
//             <Link href="/" className="flex items-center space-x-2">
//               <ArrowLeft className="w-5 h-5" />
//               <span className="text-gray-600 hover:text-gray-900">Back to Home</span>
//             </Link>
//             <div className="flex items-center space-x-2">
//               <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
//                 <FileText className="w-5 h-5 text-white" />
//               </div>
//               <span className="text-xl font-bold text-gray-900">HealthAnalyzer</span>
//             </div>
//           </div>
//         </header>

//         <div className="container mx-auto px-4 py-20 max-w-2xl">
//           <div className="text-center mb-12">
//             <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
//               <Upload className="w-10 h-10 text-white" />
//             </div>
//             <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Your Health Report</h1>
//             <p className="text-xl text-gray-600">
//               Upload your medical report PDF to get started with AI-powered analysis and insights.
//             </p>
//           </div>

//           <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
//             <CardHeader className="text-center pb-2">
//               <CardTitle className="text-2xl">Choose Your Report</CardTitle>
//               <CardDescription>Upload a PDF file of your medical report, lab results, or health document</CardDescription>
//             </CardHeader>
//             <CardContent className="pt-6">
//               <div className="space-y-6">
//                 <div
//                   className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
//                   onClick={() => fileInputRef.current?.click()}
//                 >
//                   <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                   <p className="text-lg font-medium text-gray-700 mb-2">
//                     {isUploading ? "Processing..." : "Click to upload or drag and drop"}
//                   </p>
//                   <p className="text-gray-500">PDF files only (Max 10MB)</p>
//                   <input
//                     ref={fileInputRef}
//                     type="file"
//                     accept=".pdf"
//                     onChange={handleFileUpload}
//                     className="hidden"
//                     disabled={isUploading}
//                   />
//                 </div>

//                 <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
//                   <div className="flex items-center">
//                     <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
//                     Secure Upload
//                   </div>
//                   <div className="flex items-center">
//                     <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
//                     HIPAA Compliant
//                   </div>
//                   <div className="flex items-center">
//                     <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
//                     Data Protected
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <div className="mt-8 p-4 bg-blue-50 rounded-lg">
//             <div className="flex items-start">
//               <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
//               <div>
//                 <h3 className="font-medium text-blue-900 mb-1">Privacy & Security</h3>
//                 <p className="text-blue-700 text-sm">
//                   Your health data is encrypted and processed securely. We don't store your files permanently and all
//                   data is deleted after your session ends.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
//       <header className="border-b bg-white/80 backdrop-blur-sm">
//         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
//               <ArrowLeft className="w-5 h-5" />
//               <span>Home</span>
//             </Link>
//             <div className="flex items-center space-x-2">
//               <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
//                 <FileText className="w-5 h-5 text-white" />
//               </div>
//               <span className="text-xl font-bold text-gray-900">HealthAnalyzer</span>
//             </div>
//           </div>
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2 text-sm text-gray-600">
//               <CheckCircle className="w-4 h-4 text-green-500" />
//               <span className="truncate max-w-32">{fileName}</span>
//             </div>
//             <Button variant="outline" size="sm" onClick={resetUpload}>
//               Upload New
//             </Button>
//           </div>
//         </div>
//       </header>

//       <div className="container mx-auto px-4 py-6 max-w-4xl h-[calc(100vh-80px)]">
//         <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
//           <div className="border-b p-6">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
//                 <MessageSquare className="w-5 h-5 text-white" />
//               </div>
//               <div>
//                 <h2 className="text-xl font-semibold text-gray-900">Health Report Assistant</h2>
//                 <p className="text-gray-600">Ask me anything about your health report</p>
//               </div>
//             </div>
//           </div>

//           <ScrollArea className="flex-1 p-6">
//             <div className="space-y-6">
//               {messages.map((message) => (
//                 <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
//                   <div
//                     className={`max-w-[80%] rounded-lg px-4 py-3 ${
//                       message.role === "user"
//                         ? "bg-gradient-to-r from-blue-600 to-green-600 text-white"
//                         : "bg-gray-100 text-gray-900"
//                     }`}
//                   >
//                     <div className="whitespace-pre-wrap">{message.content}</div>
//                   </div>
//                 </div>
//               ))}
//               {isLoading && (
//                 <div className="flex justify-start">
//                   <div className="bg-gray-100 rounded-lg px-4 py-3">
//                     <div className="flex items-center space-x-2">
//                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                       <div
//                         className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                         style={{ animationDelay: "0.1s" }}
//                       ></div>
//                       <div
//                         className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                         style={{ animationDelay: "0.2s" }}
//                       ></div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </ScrollArea>

//           <div className="border-t p-6">
//             <form onSubmit={handleChatSubmit} className="flex space-x-4">
//               <Input
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 placeholder="Ask about your health report..."
//                 className="flex-1"
//                 disabled={isLoading}
//               />
//               <Button
//                 type="submit"
//                 disabled={isLoading || !input.trim()}
//                 className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
//               >
//                 <Send className="w-4 h-4" />
//               </Button>
//             </form>
//             <p className="text-xs text-gray-500 mt-2">
//               This AI assistant can help explain your health report, but always consult with healthcare professionals
//               for medical advice.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, MessageSquare, Send, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [pdfContent, setPdfContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file");
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload PDF to backend");
      }

      const data = await response.json();
      const extractedText = data.extracted_text;

      if (!extractedText) {
        throw new Error("Backend returned empty PDF content");
      }

      setPdfContent(extractedText);
      setPdfUploaded(true);

      setMessages([
        {
          id: "system-initial",
          role: "assistant",
          content: `✅ PDF "${file.name}" analyzed. You can now ask questions about your health report.`,
        },
      ]);
    } catch (error) {
      console.error("PDF Upload Error:", error);
      alert("Error uploading PDF. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!pdfContent) {
      alert("Please upload a PDF before chatting.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput("");

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdf_content: pdfContent,
          user_message: userMessage.content,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend Error Response:", errorText);
        throw new Error("Failed to get AI response from backend.");
      }

      const data = await response.json();

      const assistantReply: Message = {
        id: Date.now().toString() + "-assistant",
        role: "assistant",
        content: data.assistant_reply,
      };

      setMessages((prev) => [...prev, assistantReply]);
    } catch (error) {
      console.error("Chat Submit Error:", error);
      alert("Error communicating with AI backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetUpload = () => {
    setPdfUploaded(false);
    setPdfContent("");
    setFileName("");
    setMessages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-gray-600 hover:text-gray-900">Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">HealthAnalyzer</span>
          </div>
        </div>
      </header>

      {!pdfUploaded ? (
        <div className="container mx-auto px-4 py-20 max-w-2xl">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Your Health Report</h1>
            <p className="text-xl text-gray-600">Upload your medical report PDF to get AI-powered analysis.</p>
          </div>

          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Choose Your Report</CardTitle>
              <CardDescription>Only PDF files supported (Max 10MB)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">{isUploading ? "Uploading..." : "Click to upload"}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Privacy Notice</h3>
                <p className="text-blue-700 text-sm">Your PDF will not be stored permanently. Data clears after session ends.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6 max-w-4xl h-[calc(100vh-80px)]">
          <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
            <div className="border-b p-6 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Health Report Chat</h2>
                <p className="text-gray-600">Ask questions about your uploaded report</p>
              </div>
              <Button variant="outline" size="sm" onClick={resetUpload} className="ml-auto">
                Upload New Report
              </Button>
            </div>

            <ScrollArea className="flex-1 p-6 space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-green-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-3 animate-pulse text-gray-500">AI is thinking...</div>
                </div>
              )}
            </ScrollArea>

            <div className="border-t p-6">
              <form onSubmit={handleChatSubmit} className="flex space-x-4">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your health query..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                This AI assistant provides explanations, not medical advice. Consult a doctor for clinical decisions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
