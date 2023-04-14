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
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [last, setLast] = useState();
  const [first, setFirst] = useState();

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
      setQAPairs(data.result);
      setTextInput("");
      setAmountInput("");

      setIndexQ(0);
      setCurrentQuestion(data.result[0].question);
      setCurrentAnswer(data.result[0].answer);
      setLast(false);
      setFirst(true);

    } catch(error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }    

  function showNext(){
    if (indexQ+1 < qaPairs.length){
      setCurrentQuestion(qaPairs[indexQ+1].question);
      setCurrentAnswer(qaPairs[indexQ+1].answer);
      if (indexQ+1==qaPairs.length-1){
        setLast(true);
      }
      setIndexQ(indexQ+1);
      setShowAnswers(false);
      setFirst(false);
    }
  }

  function showPrevious(){
    if (indexQ-1 >= 0){
      setCurrentQuestion(qaPairs[indexQ-1].question);
      setCurrentAnswer(qaPairs[indexQ-1].answer);
      if (indexQ-1==0){
        setFirst(true);
      }
      setIndexQ(indexQ-1);
      setShowAnswers(false);
      setLast(false);
    }
  }

  return (
    <div>
      <Head>
        <title>QuizGenius</title>
        <link rel="icon" href="/QuizGenius-Q.png" />
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
            id = "thetextbox"
            class="text-input" 
            type = "text"
            placeholder="Type your text: "
            rows="4" 
            cols="50"
            height= "auto"
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
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
          
          <input 
          type="submit" 
          class="submitButton" 
          value="Generate questions"
          onClick={handleBoxSize}
          />
          
          </form>
        </div>
        
        <div className={styles.result1}>
          {qaPairs.length > 0 && (
            <button className="hideShow" onClick={() => setShowAnswers(!showAnswers)}>
              {showAnswers ? "Hide Answers" : "Show Answers"}
            </button>
          )}
        </div>    
        <div className={styles.result2}>
          <div className={styles.containerLeftArrow}>
            {!first && <button className={styles.buttonleft} onClick={()=> showPrevious()}> </button>}
          </div>

          <div className={styles.questionAndAnswer}>
            {currentQuestion}
            {showAnswers && <p className={styles.answer}> {currentAnswer}</p>}
          </div>

          <div className={styles.containerRightArrow}>
            {!last &&<button className={styles.buttonright} onClick={()=> showNext()}></button>}
          </div>    

        </div>      
      </main>
    </div>
  );
}

function handleBoxSize() {
  var myBox = document.getElementById("thetextbox");
  myBox.style.height = "auto";
}