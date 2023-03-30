import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [animalInput, setAnimalInput] = useState("");
  const [result, setResult] = useState();
  const [amountInput, setAmountInput] = useState("");
  const [qaPairs, setQAPairs] = useState([]);
  const [showAnswers, setShowAnswers] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
    
        body: JSON.stringify({ inputText: animalInput, amount: amountInput }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      //setResult(data.result);
      const formattedResult = formatResult(data.result);
      setResult(formattedResult);
      console.log("NEW LOG YIPPI: " + formattedResult);
      
      //ny metod som splittar upp i questions answers i array så att vi kan iterera varje steg för steg och sätta upp form och buttons för interaktion
      const test = trimUnfinishedSentences(data.result);
      console.log(test);
      

      console.log(trimUnfinishedSentences(data.result));
      setAnimalInput("");
      let arr = formatResult(data.result);
      console.log(arr);


      setAmountInput("");
      setQAPairs(createQAPairs(data.result));
    } catch(error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }


  var processedQs = qaPairs.map((qaPair, index) => (
    <div key={index} className={styles.qaPair}>

    <p>{qaPair.question}</p>
    {showAnswers && <p className = {styles.answer}> {qaPair.answer}</p>}

    </div>
  ));

  

  function createQAPairs(result){
    const paragraphs = result.split(/\n\s*\n/);
    const qaPairs = [];

    paragraphs.forEach((paragraph) => {
      const lines = paragraph.split("\n");
      if (lines.length >= 2) {
        qaPairs.push({
          question: lines[0],
          answer: lines[1],
        });
      }
    });
    console.log(qaPairs);
    return qaPairs;
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
          <input 
            type="text" 
            name="amount" 
            placeholder="Number of questions" 
            value={amountInput} 
            onChange={(f) => setAmountInput(f.target.value)}
          />
          <input type="submit" value="Generate questions" />
        </form>
        <div className={styles.result}>
          {qaPairs.length > 0 && (
            <button onClick={() => setShowAnswers(!showAnswers)}>
              {showAnswers ? "Hide Answers" : "Show Answers"}
            </button>
          )}
          {processedQs}
        </div>        
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

  const resultArray = questionsReg.map((question, index) => ({
    question,
    answer: answersNew[index],
    showAnswer: false
  }));

  return result;
}