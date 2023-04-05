import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [textInput, setTextInput] = useState("");
  const [result, setResult] = useState();
  const [amountInput, setAmountInput] = useState("");
  const [qaPairs, setQAPairs] = useState([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [indexQ, setIndexQ] = useState();

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
    
        body: JSON.stringify({ inputText: textInput, amount: amountInput }),
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
      setTextInput("");
      let arr = formatResult(data.result);
      console.log(arr);


      setAmountInput("");
      setQAPairs(createQAPairs(data.result));

      console.log(qaPairs);

      console.log(qaPairs[0]);

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
    setIndexQ(0);
    setCurrentQuestion(qaPairs[0].question);
    return qaPairs;
  }
  

  function showNext(){
    if (indexQ+1 < qaPairs.length){
      console.log("new index", indexQ);
      console.log(qaPairs.length);
      setCurrentQuestion(qaPairs[indexQ+1].question);
      setIndexQ(indexQ+1);
    }
  }

  function showPrevious(){
    if (indexQ-1 >= 0){
      console.log(indexQ);
      setCurrentQuestion(qaPairs[indexQ-1].question);
      setIndexQ(indexQ-1);
    }
  }

  return (
    <div>
      <Head>
        <title>Quiz GPT</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <div>
        <img src="/QuizGenius-1.png" className={styles.icon} />

        </div>
        <div>
        <h3>Autogenerate quiz questions for your own text</h3>

        </div>
        <div class="containerForm">
          <form onSubmit={onSubmit}>
          <div class="textAreaInput">
          <textarea 
            class="text-input" 
            type = "text"
            placeholder="Type your text: "
            rows="4" 
            cols="50"
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          ></textarea>
        </div>
          

          <div name="numberOfQuestions">
            <input 
            type="text" 
            name="amount" 
            placeholder="Number of questions" 
            value={amountInput} 
            onChange={(f) => setAmountInput(f.target.value)}
          />
          </div>
          
          <input type="submit" class="submitButton" value="Generate questions"/>
          
          </form>
        </div>
        
        <div className={styles.result}>
          {qaPairs.length > 0 && (
            <button onClick={() => setShowAnswers(!showAnswers)}>
              {showAnswers ? "Hide Answers" : "Show Answers"}
            </button>
          )}
          {processedQs}
        </div>    
        <div className={styles.result}>
          <button onClick={()=> showPrevious()}>
            Previous
          </button>
          {currentQuestion}
          <button onClick={()=> showNext()}>
            Next
          </button>
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
  console.log(resultArray);

  return result;
}