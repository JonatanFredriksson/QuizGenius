import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "./index.module.css";

import localforage from "localforage";

export default function Home() {
  const [textInput, setTextInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [qaPairs, setQAPairs] = useState([]);

  const [showAnswers, setShowAnswers] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [indexQ, setIndexQ] = useState();
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [last, setLast] = useState();
  const [first, setFirst] = useState("");

  useEffect(() => {
    // Fetch the most recently stored QA pair from local storage
    localforage.getItem("qaPairs").then((storedQAPairs) => {
      if (storedQAPairs) {
        setQAPairs(storedQAPairs);
        // Set the initial question and answer to the most recent QA pair
        const mostRecentQAPair = storedQAPairs[0];
        setCurrentQuestion(mostRecentQAPair.question);
        setCurrentAnswer(mostRecentQAPair.answer);
        setIndexQ(0);
        setFirst(true);
        document.getElementById("downloadButton").addEventListener("click", function() {
          console.log("TESTESTTESTSTSTST");
          console.log(storedQAPairs);
          downloadStoredFlashcards(storedQAPairs);
        });
      }
    }).catch((error) => {
      // Handle any errors that may occur during fetching
      console.error("Error fetching data from local storage:", error);
    });
  }, []);

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
      console.log("This is the data: " + data.result);
      const formattedResult = (data.result); //formateringen måste nu ändras när vi ändrat datastrukturen, vi skippar detta steg, formatterar i generate istället
      setQAPairs(formattedResult); //vi sätter datan i variabeln qaPairs


      localforage.setItem("qaPairs", formattedResult);

      console.log(qaPairs);
      console.log(formattedResult);




      

      //window.scrollTo(0, document.body.scrollHeight);
      document.querySelector('#output').scrollIntoView({ behavior: 'smooth', block: 'end' });



      //console.log(trimUnfinishedSentences(data.result)); //fungerar inte just nu med arrayen

      initializeArrows(formattedResult);

      document.getElementById("downloadButton").addEventListener("click", function(){
        console.log("TESTESTTESTSTSTST");
        downloadStoredFlashcards(storedQAPairs);
      }); //

      // Trigger uploadFlashcards() function when a file input changes
      //document.getElementById("uploadInput").addEventListener("change", uploadFlashcards);


    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }


  function downloadStoredFlashcards(storedQAPairs){
    console.log("Check me out");
    
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storedQAPairs));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "flashcards.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();


  }

  // Function to upload and load question and answer pairs from a JSON file
function uploadFlashcards(event) {
  console.log("uploader");
  var file = event.target.files[0];
  //var file = document.getElementById("fileInput");
  var reader = new FileReader();
  reader.onload = function (e) {
      var flashcards = JSON.parse(e.target.result);
      console.log("Flashcards loaded from file:");
      console.log(flashcards);
      // Use the loaded flashcards as needed, e.g., update your flashcards data structure or render them on the page
  };
  reader.readAsText(file);
  setQAPairs(event); //säter qaPair till det upladdade
  initializeArrows(event);
}

  


  function initializeArrows(dataRes) { //gör en metod så att vi får lite mer coherent vad grejerna gör
    setTextInput("");
    setAmountInput("");
    //setQAPairs(dataRes);


    console.log(dataRes);

    setIndexQ(0);
    setCurrentQuestion(dataRes[0].question);
    setCurrentAnswer(dataRes[0].answer);
    setLast(false);
    setFirst(true);
  }

  function showNext() {
    if (indexQ + 1 < qaPairs.length) {
      setCurrentQuestion(qaPairs[indexQ + 1].question);
      setCurrentAnswer(qaPairs[indexQ + 1].answer);
      if (indexQ + 1 == qaPairs.length - 1) {
        setLast(true);
      }
      setIndexQ(indexQ + 1);
      setShowAnswers(false);
      setFirst(false);
    }
  }

  function showPrevious() {
    if (indexQ - 1 >= 0) {
      setCurrentQuestion(qaPairs[indexQ - 1].question);
      setCurrentAnswer(qaPairs[indexQ - 1].answer);
      if (indexQ - 1 == 0) {
        setFirst(true);
      }
      setIndexQ(indexQ - 1);
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
        <h3>Autogenerate quiz questions!</h3>
          <h5>Either write in your own notes to create quiz questions from or simply type in a topic</h5>

        </div>
        <div class="containerForm">
          <form onSubmit={onSubmit}>
            <div class="textAreaInput">
              <textarea
                class="text-input"
                type="text"
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

            <input type="submit" class="submitButton" value="Generate questions" />

          </form>
        </div>

        <div className={styles.result1}>
          {qaPairs.length > 0 && (
            <button
            id="hideShowBTN"
            className={styles.hideShow}
            onClick={() => setShowAnswers(!showAnswers)}
            
          >
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </button>
          )}
        </div>
        <div className={styles.result2}>
          <div className={styles.containerLeftArrow}>
            {!first && <button className={styles.buttonleft} onClick={() => showPrevious()}> </button>}
          </div>

          <div className={styles.questionAndAnswer} id="output">
            {currentQuestion}
            {showAnswers && <p className={styles.answer}> {currentAnswer}</p>}
          </div>

          <div className={styles.containerRightArrow}>
            {!last && <button className={styles.buttonright} onClick={() => showNext()}></button>}
          </div>

        </div>
        <p className = {styles.textarea}>Download File</p>

        <button className={styles.downloadUpload} id="downloadButton">
        <img src="/DownloadIconTransparent.png" className={styles.iconDownload} />

        </button>

        

        <div className={styles.uploadFileButton}>
        <label htmlFor="fileInput" className={styles.customFileInput}>
            Upload File
        </label>
        </div>
        <input className={styles.uploadFileButton}
  id="fileInput"
  type="file"
  accept=".json"
  onChange={uploadFlashcards}
  style={{ display: 'none' }}
/>

      </main>
    </div>
  );
}




