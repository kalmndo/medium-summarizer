import { parse } from "node-html-parser"

import { OpenAIStream } from "@/lib/utils"

export const config = {
  runtime: "edge",
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI")
}

export default async function handler(req: Request) {
  const { url } = (await req.json()) as {
    url?: string
  }

  if (!url) {
    return new Response("No prompt in the request", { status: 500 })
  }

  try {
    const response = await fetch(url, {
      method: "GET",
    })

    const data = await response.text()
    const root = parse(data)

    const body = root.querySelector("section")
    const text = body!.innerText
      .replace(/(\r\n|\n|\r)/gm, "")
      .replace(/(\r\t|\t|\r)/gm, "")

    // const prompt = `I want you to act like a medium article summarizer. I will input text from a medium article and your job is to convert it into a useful summary of a few sentences. Do not repeat sentences and make sure all sentences are clear and complete: "${text}"`

    const prompt = `
    Guidelines for summarizing an article:

    - State the main ideas.
    - Identify the most important details that support the main ideas.
    - Summarize in your own words.
    - Do not copy phrases or sentences unless they are being used as direct quotations.
    - Express the underlying meaning of the article, but do not critique or analyze.
    - The summary should be about one third the length of the original article. 
    
    Your summary should include:
    - Introduction
     - Give an overview of the article, including the title and the name of the author.
     - Provide a thesis statement that states the main idea of the article.
    - Body Paragraphs
     - Use the body paragraphs to explain the supporting ideas of your thesis statement.
     - The number of paragraphs will depend on the length of the original article. 
      - One-paragraph summary - one sentence per supporting detail, providing 1-2 examples for each.
      - Multi-paragraph summary - one paragraph per supporting detail, providing 2-3 examples for each.
     - Start each paragraph with a topic sentence.
     - Use transitional words and phrases to connect ideas.
    - Concluding Paragraph
     - Summarize your thesis statement and the underlying meaning of the article.
    I want you to summarize based on the Guidelines with this text: "${text}"
    `

    const payload = {
      model: "text-davinci-003",
      prompt,
      temperature: 0.5,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 200,
      stream: true,
      n: 1,
    }

    const stream = await OpenAIStream(payload)
    return new Response(stream)
  } catch (e: any) {
    console.log({ e })
    return new Response(e, { status: 500 })
  }
}
