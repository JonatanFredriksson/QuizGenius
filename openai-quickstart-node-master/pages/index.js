import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [animalInput, setAnimalInput] = useState("");
  const [result, setResult] = useState();

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputText: animalInput }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      setResult(data.result);
      //ny metod som splittar upp i questions answers i array så att vi kan iterera varje steg för steg och sätta upp form och buttons för interaktion
      const test = trimUnfinishedSentences(data.result);
      console.log(test);
      

      console.log(trimUnfinishedSentences(data.result));
      setAnimalInput("");
      let arr = formatResult(data.result);
      console.log(arr);
    } catch(error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <div>
      <Head>
        <title>Quiz GPT</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <img src="/QuizGenius-1.png" className={styles.icon} />
        <h3>Quiz my text</h3>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="Text"
            placeholder="Enter a text"
            value={animalInput}
            onChange={(e) => setAnimalInput(e.target.value)}
          />
          <input type="submit" value="Quiz me!" />
        </form>
        <div className={styles.result}>{result}</div>
        
      </main>
    </div>
  );
}

function trimUnfinishedSentences(generatedText){

// Match the end of sentences and split the output into sentences
const sentences = generatedText.match(/[^.?!\n]+[.?!\n]+/g) || [];

// Filter out incomplete sentences
const completeSentences = sentences.filter(sentence => {
  const trimmedSentence = sentence.trim();
  return trimmedSentence.length > 0 && trimmedSentence.charAt(trimmedSentence.length - 1).match(/[.?!]/);
});
return completeSentences;
}





function formatResult(generatedText)
{
  const regexAnswer = /A\d+: ([^A].+?)(?=Q\d+|$)/gs;
  const answersNew = generatedText.match(regexAnswer).map(a => a.replace(/A\d+: /, ''));

  console.log(generatedText);

  const questionsReg= generatedText.match(/Q\d+: (.+?)\?/g).map(q => q.replace(/Q\d+: /, ''));
  

  console.log("Questions från regen: " + questionsReg);
  console.log("Answers från regen: " + answersNew);

  const formattedQuestions = questionsReg.join('\n\n');
  const formattedAnswers = answersNew.join('\n\n');
  const result = `Generated Questions: \n\n${formattedQuestions}\n\nGenerated Answers:\n\n${formattedAnswers}`;


  return result;
}