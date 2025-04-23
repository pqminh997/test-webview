"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function WebViewBridgeTest() {
  const [messageToNative, setMessageToNative] = useState("")
  const [receivedFromNative, setReceivedFromNative] = useState("")
  const [logs, setLogs] = useState<string[]>([])

  // Function to send message to React Native
  const sendToReactNative = (message: string) => {
    addLog(`Sending to React Native: ${message}`)

    try {
      // For iOS
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.reactNativeWebView) {
        window.webkit.messageHandlers.reactNativeWebView.postMessage(message)
        addLog("Message sent via iOS bridge")
      }
      // For Android
      else if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(message)
        addLog("Message sent via Android bridge")
      } else {
        addLog("No React Native WebView bridge found. Are you viewing this in a React Native WebView?")
      }
    } catch (error) {
      addLog(`Error sending message: ${error}`)
    }
  }

  // Add a message to the log
  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // Set up listener for messages from React Native
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let receivedMessage: string

      // Ensure the message is a string
      if (typeof event.data === "object") {
        try {
          receivedMessage = JSON.stringify(event.data)
        } catch (e) {
          receivedMessage = "Error: Received object that couldn't be stringified"
        }
      } else {
        receivedMessage = String(event.data)
      }

      addLog(`Received from React Native: ${receivedMessage}`)
      setReceivedFromNative(receivedMessage)
    }

    window.addEventListener("message", handleMessage)

    // Add a global function that React Native can call
    window.receiveMessageFromReactNative = (message: string | object) => {
      let messageStr: string

      // Ensure the message is a string
      if (typeof message === "object") {
        try {
          messageStr = JSON.stringify(message)
        } catch (e) {
          messageStr = "Error: Received object that couldn't be stringified"
        }
      } else {
        messageStr = String(message)
      }

      addLog(`Received via direct function call: ${messageStr}`)
      setReceivedFromNative(messageStr)
    }

    addLog("WebView initialized and ready")

    return () => {
      window.removeEventListener("message", handleMessage)
      delete window.receiveMessageFromReactNative
    }
  }, [])

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>WebView ⟷ React Native Bridge Test</CardTitle>
          <CardDescription>Test sending and receiving data between WebView and React Native</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Send Message to React Native</h3>
            <div className="flex space-x-2">
              <Input
                value={messageToNative}
                onChange={(e) => setMessageToNative(e.target.value)}
                placeholder="Enter message to send to React Native"
              />
              <Button onClick={() => sendToReactNative(messageToNative)}>Send</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Received from React Native</h3>
            <div className="p-3 bg-gray-100 rounded-md min-h-[50px] break-words">
              {receivedFromNative || "No messages received yet"}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Quick Test Buttons</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => sendToReactNative(JSON.stringify({ type: "ping", data: "Hello from WebView!" }))}
              >
                Send Ping
              </Button>
              <Button
                variant="outline"
                onClick={() => sendToReactNative(JSON.stringify({ type: "getData", id: "123" }))}
              >
                Request Data
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  sendToReactNative(
                    JSON.stringify({ type: "submitForm", data: { name: "Test User", email: "test@example.com" } }),
                  )
                }
              >
                Submit Form Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea className="font-mono text-sm h-[200px]" readOnly value={logs.join("\n")} />
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setLogs([])}>
            Clear Logs
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Add TypeScript declarations for the window object
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
    webkit?: {
      messageHandlers: {
        reactNativeWebView: {
          postMessage: (message: string) => void
        }
      }
    }
    receiveMessageFromReactNative?: (message: string | object) => void
  }
}
