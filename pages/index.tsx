import { useState } from "react"
import Head from "next/head"
import { useToast } from "@/hooks/use-toast"

import Footer from "@/components/footer"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function IndexPage() {
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [summary, setSummary] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [curArticle, setCurArticle] = useState<string>("")

  const curUrl = String(curArticle.split(".com")[1])

  const generateSummary = async (url?: string) => {
    setSummary("")
    if (url) {
      if (!url.includes("medium.com")) {
        toast({ title: "Please enter a valid Medium article" })
        return
      }
      setCurArticle(url)
    }
    setLoading(true)
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: url ? url : curArticle }),
    })

    if (!response.ok) {
      console.log("error", response.statusText)
      return
    }

    const data = response.body
    if (!data) {
      return
    }

    const reader = data.getReader()
    const decoder = new TextDecoder()
    let done = false

    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)
      setSummary((prev) => prev + chunkValue)
    }
    setLoading(false)
  }

  return (
    <Layout>
      <Head>
        <title>Medium summarizer</title>
        <meta
          name="description"
          content="Summarize any medium article with AI"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="mx-auto mt-20 mb-10 max-w-md px-2.5 text-center sm:max-w-5xl sm:px-0">
        <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.15] text-black sm:text-6xl sm:leading-[1.15]">
          Summarize any{" "}
          <span className="bg-gradient-to-r from-amber-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
            Medium{" "}
          </span>
          article with AI
        </h1>
        <h2 className="mt-16 text-md text-gray-600 sm:text-lg">
          Copy and paste any{" "}
          <span className="bg-gradient-to-r from-amber-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
            Medium{" "}
          </span>{" "}
          article link below
        </h2>
        <div className="mx-auto mt-5">
          <Input
            placeholder="Input medium link article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="mx-auto mt-10 flex max-w-fit space-x-4">
          <Button
            disabled={loading}
            size="lg"
            onClick={() => {
              generateSummary(url)
            }}
          >
            SUMMARIZE
          </Button>
        </div>
        {summary && (
          <div className="mb-10 px-4">
            <h2 className="mx-auto mt-16 max-w-3xl border-t border-gray-600 pt-8 text-center text-3xl font-bold sm:text-5xl">
              Summary
            </h2>
            <div className="mx-auto mt-6 max-w-3xl text-lg leading-7 text-left ">
              {summary.split(". ").map((sentence, index) => (
                <div key={index}>
                  {sentence.length > 0 && (
                    <li className="mb-2 list-disc">{sentence}</li>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <Footer />
      </div>
    </Layout>
  )
}
