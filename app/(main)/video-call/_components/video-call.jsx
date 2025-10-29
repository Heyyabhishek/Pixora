"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { toast } from "sonner";

const VideoCall = ({ sessionId, token }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    const sessionRef = useRef(null);
    const publisherRef = useRef(null);

    const router = useRouter();

    const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

    const handleScriptLoad = () => {
        console.log("Script load event triggered");
        setScriptLoaded(true);

        if(!window.OT) {
            console.error("window.OT is undefined after script load");
            toast.error("Failed to load Vonage Video API");
            setIsLoading(false);
            return;
        }
        console.log("window.OT is available:", window.OT);
        //Initialize the video session once script is loaded
        initializeSession();
    };

    const initializeSession = () => {
        if(!sessionId || !token || !appId) {
            toast.error("Missing required video call parameters");
            router.push("/appointments");
            return;
        }

        try {
            sessionRef.current = window.OT.initSession(appId, sessionId);

            sessionRef.current.on("streamCreated", (event) => {
                sessionRef.current.subscribe (
                    event.stream,
                    "subscriber",
                    {
                        insertMode: "append",
                        width: "100%",
                        height: "100%"
                    },
                    (error) => {
                        if(error) {
                            toast.error("Error connecting to other participant's stream");
                        }
                    }      
                );
            });

            // Initialize publisher before connecting
            publisherRef.current = window.OT.initPublisher("publisher", {
                insertMode: "replace",
                width: "100%",
                height: "100%",
                publishAudio: true,
                publishVideo: true,
            },
            (error) => {
                if(error) {
                    console.error("publisher error:", error);
                    toast.error("Error initializing your camera and microphone");
                } else {
                    console.log("Publisher initialized successfully");
                }
            });

            sessionRef.current.on("sessionConnected", () => {
                setIsConnected(true);
                setIsLoading(false);
                console.log("Session connected successfully");
            });

            sessionRef.current.on("sessionDisconnected", () => {
                setIsConnected(false);
            });

            sessionRef.current.connect(token, (error) => {
                if(error) {
                    toast.error("Error connecting to video session");
                } else {
                    if(publisherRef.current) {
                        sessionRef.current.publish(publisherRef.current, (error) => {
                            if (error) {
                                console.log("Error publishing stream:", error);
                                toast.error("Error publishing your stream");
                            } else {
                                console.log("Stream published successfully");
                            }
                        });
                    }
                }
            });
        } catch (error) {
            toast.error("Failed to initialize video call");
            setIsLoading(false);
        }
    };

    if(!sessionId || !token || !appId){
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-3xl font-bold text-white mb-4">
                    Invalid Video call
                </h1>
                <p className="text-muted-foreground mb-6">
                    Missing required parameters for the video call
                </p>
                <Button
                  onClick={() => router.push("/appointments")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Back to Appointments
                </Button>
            </div>
        );
    }

    return (
    <>
     <Script
       src="https://static.opentok.com/v2/js/opentok.min.js"
       onLoad={handleScriptLoad}
       onError={(e) => {
        console.error("Script loading error:", e);
        toast.error("Failed to load video call script");
        setIsLoading(false);
       }}
       strategy="afterInteractive"
     />
     <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
                Video Consultation
            </h1>
            <p className="text-muted-foreground">
                {isConnected
                  ? "connected"
                  : isLoading
                  ? "Connecting...."
                  : "Connection failed"}
            </p>
        </div>

        {/* Video Streams Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Subscriber - Other participant's video */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                <div id="subscriber" className="w-full h-full">
                    {!isConnected && (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Waiting for other participant...
                        </div>
                    )}
                </div>
            </div>

            {/* Publisher - Your video */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                <div id="publisher" className="w-full h-full">
                    {isLoading && (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Loading camera...
                        </div>
                    )}
                </div>
            </div>
        </div>
     </div>
    </>
    );
};

export default VideoCall;