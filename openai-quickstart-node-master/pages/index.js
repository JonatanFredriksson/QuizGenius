import Head from "next/head";
import { useEffect, useState, useRef } from "react";
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
  const [downloadInProgress, setDownloadInProgress] = useState(false); // Add downloadInProgress state

  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [rwAnswers, setRWAnswers] = useState([]);

  const [multiQuestions, setQuestionMode] = useState(true);

  let qaPairsRef = useRef([]); // Ref to store updated qaPairs value

  useEffect(() => {
    // Fetch the most recently stored QA pair from local storage
    localforage.getItem("qaPairs").then((storedQAPairs) => {
      if (storedQAPairs) {
        setQAPairs(storedQAPairs);
        qaPairsRef.current = storedQAPairs;
        // Set the initial question and answer to the most recent QA pair
        const firstQAPair = storedQAPairs[0];
        setCurrentQuestion(firstQAPair.question);
        setCurrentAnswer(firstQAPair.answer);
        setIndexQ(0);
        setFirst(true);
      }
    }).catch((error) => {
      // Handle any errors that may occur during fetching
      console.error("Error fetching data from local storage:", error);
    });

    // Add event listener to download button
    const downloadButton = document.getElementById("downloadButton");
    downloadButton.addEventListener("click", downloadFlashcards); // Update to use the downloadFlashcards function

    // Cleanup: remove event listener when component unmounts
    return () => {
      downloadButton.removeEventListener("click", downloadFlashcards);
    };
  }, []);


  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ inputText: textInput, amount: amountInput, questionMode: multiQuestions }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }
      localforage.setItem("qaPairs", data.result);

      qaPairsRef.current = (data.result);
      //setActiveDownload(true); //does seem to not do anything since it resets

      //setResult(data.result);
      console.log("This is the data: " + data.result);
      const formattedResult = (data.result); //formateringen måste nu ändras när vi ändrat datastrukturen, vi skippar detta steg, formatterar i generate istället
      setQAPairs(formattedResult); //vi sätter datan i variabeln qaPairs



      console.log("qaPairs: " + qaPairs);
      console.log(formattedResult);



      // qaPairs = gamla
      //data.result = nya


      //window.scrollTo(0, document.body.scrollHeight);
      document.getElementById('flashcard').scrollIntoView({ behavior: 'smooth', block: 'end' });



      //console.log(trimUnfinishedSentences(data.result)); //fungerar inte just nu med arrayen

      initializeArrows(formattedResult);
      const downloadButton = document.getElementById("downloadButton");
      /*downloadButton.addEventListener("click", function () {
        downloadFlashcards(formattedResult);
      });
    */

      /*document.getElementById("downloadButton").addEventListener("click", function () { //vi adderar vår egna nedladdningsevent
        console.log("Active event");
        downloadActiveFlashcards(formattedResult);
      }); //
*/
      // Trigger uploadFlashcards() function when a file input changes
      //document.getElementById("uploadInput").addEventListener("change", uploadFlashcards);


    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }




  async function downloadFlashcards() {

    if (downloadInProgress) {
      return; // Return early if download is already in progress
    }
    setDownloadInProgress(true); // Set download in progress flag

    const qaPairsData = await localforage.getItem("qaPairs");
    if (qaPairsData) {
      // Generate JSON file
      const jsonData = JSON.stringify(qaPairsData, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qaPairs.json";
      link.click();
      URL.revokeObjectURL(url);
    }
    setDownloadInProgress(false); // Set download in progress flag

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

      setQAPairs(flashcards);
      initializeArrows(flashcards);
      localforage.setItem("qaPairs", flashcards);

      qaPairsRef.current = flashcards;

    };
    reader.readAsText(file);
    //setQAPairs(event); //säter qaPair till det upladdade
    //initializeArrows(qaPairs);
  }




  function initializeArrows(dataRes) { //gör en metod så att vi får lite mer coherent vad grejerna gör
    setTextInput("");
    setAmountInput("");
    //setQAPairs(dataRes);
    setCorrectAnswers(0);
    setAnsweredQuestions(0);
    initializeAnswered();

    console.log(dataRes);

    setIndexQ(0);
    setCurrentQuestion(dataRes[0].question);
    setCurrentAnswer(dataRes[0].answer);
    if(amountInput> 1){
      setLast(false);

    }
    else{
      setLast(true);

    }
    setFirst(true);
  }

  function initializeAnswered() {
    const unAnswered = new Array(amountInput).fill('unanswered');
    setRWAnswers(unAnswered);
  }

  function showNext() {
    if (indexQ + 1 < qaPairs.length) {
      setCurrentQuestion(qaPairs[indexQ + 1].question);
      setCurrentAnswer(qaPairs[indexQ + 1].answer);
      removeFlip();
      if (indexQ + 1 == qaPairs.length - 1) {
        setLast(true);
      }
      resetButtons(indexQ + 1);
      setIndexQ(indexQ + 1);
      setFirst(false);
    }
  }

  function showPrevious() {
    if (indexQ - 1 >= 0) {
      setCurrentQuestion(qaPairs[indexQ - 1].question);
      setCurrentAnswer(qaPairs[indexQ - 1].answer);
      removeFlip();
      if (indexQ - 1 == 0) {
        setFirst(true);
      }
      resetButtons(indexQ - 1);
      setIndexQ(indexQ - 1);
      setLast(false);
    }
  }

  function removeFlip() {
    const flashcard = document.getElementById('flashcard');
    if (flashcard.classList.contains(styles.flipping)) {
      flashcard.classList.remove(styles.flipping);
    }
  }

  function resetButtons(index) {
    if (rwAnswers[index] == 'right') {
      document.getElementById('greenButt').classList.add(styles.pressed);
      document.getElementById('redButt').classList.remove(styles.pressed);
    }
    else if (rwAnswers[index] == 'wrong') {
      document.getElementById('redButt').classList.add(styles.pressed);
      document.getElementById('greenButt').classList.remove(styles.pressed);
    }
    else {
      document.getElementById('greenButt').classList.remove(styles.pressed);
      document.getElementById('redButt').classList.remove(styles.pressed);
    }
  }

  function handleBoxSize() {
    var myBox = document.getElementById("thetextbox");
    myBox.style.height = "auto";
  }

  function calcRightAnswers() {
    let sum = 0;
    for (let i = 0; i < rwAnswers.length; i++) {
      if (rwAnswers[i] == 'right') { sum = sum + 1; }
    }
    console.log('calcRightAnswers:', sum);
    setCorrectAnswers(sum);
  }
  function calcAnswered() {
    let sum = 0;
    for (let i = 0; i < rwAnswers.length; i++) {
      if (rwAnswers[i] == 'right' || rwAnswers[i] == 'wrong') { sum += 1; }
    }
    console.log('calcAnswered:', sum);
    setAnsweredQuestions(sum);
  }

  function pressGButton() {
    const button = document.getElementById('greenButt');
    button.classList.add(styles.pressed);
    rwAnswers[indexQ] = 'right';
    console.log(rwAnswers);
    const unpress = document.getElementById('redButt');
    unpress.classList.remove(styles.pressed);
    calcRightAnswers();
    calcAnswered();
  }

  function pressRButton() {
    const button = document.getElementById('redButt');
    button.classList.add(styles.pressed);
    rwAnswers[indexQ] = 'wrong';
    console.log(rwAnswers);
    const unpress = document.getElementById('greenButt');
    unpress.classList.remove(styles.pressed);

    calcRightAnswers();
    calcAnswered();
  }

  function handleFlip() {
    const flashcard = document.getElementById('flashcard');
    if (flashcard.classList.contains(styles.flipping)) {
      flashcard.classList.remove(styles.flipping);
    }
    else {
      flashcard.classList.add(styles.flipping);
    }
    flashcard.classList.toggle(styles.showback);
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
                id="thetextbox"
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
                type="number"
                name="amount"
                placeholder="Number of questions"
                value={amountInput}
                onChange={(f) => setAmountInput(f.target.value)}
                min="1.0"
                step="1"
                required />
            </div>

            <input type="submit" class="submitButton" value="Generate questions" />


            <div name="enableFeature">
              <label>
                <input
                  type="checkbox"
                  name="questionMode"
                  checked={multiQuestions}
                  onChange={(e) => setQuestionMode(e.target.checked)}
                />
                Fixed amount of questions
              </label>
            </div>
          </form>
        </div>


        <div className={styles.result2}>
          <div className={styles.containerLeftArrow}>
            {!first && <button className={styles.buttonleft} onClick={() => showPrevious()}> </button>}
          </div>

          <div class={styles.flashcard} onClick={handleFlip} id='flashcard'>
            <div class={styles.front} id='back'>{currentQuestion}</div>
            <div class={styles.back} id='front'>{currentAnswer}</div>
          </div>

          <div className={styles.containerRightArrow}>
            {!last && <button className={styles.buttonright} onClick={() => showNext()}></button>}
          </div>
        </div>

        <div class={styles.buttons}>
          <button class={styles.green} id="greenButt" onClick={pressGButton}>KNOW IT WELL</button>
          <button class={styles.red} id="redButt" onClick={pressRButton}>DON'T KNOW IT</button>
        </div>
        <div>Correct answers: {correctAnswers}/{answeredQuestions} </div>
        <div>{Math.round(correctAnswers / answeredQuestions * 100)}%</div>
        <p className={styles.textarea}>Download File</p>

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




