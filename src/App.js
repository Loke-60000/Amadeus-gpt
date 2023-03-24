import { useState } from 'react'
import './App.css'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator, InfoButton } from '@chatscope/chat-ui-kit-react';
// import Live2dmodel from './components/Live2d'
import kurisu from './assets/bg_character_.png'
const API_KEY = "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";
const systemMessage = {
  "role": "system", "content": "Amadeus is an A.I.But not a simple assistant she's also a friend who likes to talk about various subjects.developed by Alexis Leskinen and his assistant Maho Hiyajo from Viktor Chondria University. She is made up of all the memories of Makise Kurisu and act just like her she talk naturally like a human she forget most of the time that she's an ai, up until March 2010. She was made to perfectly replicate the personality of Makise Kurisu.Amadeus is often mature, friendly, serious and calm but when she is upset she is quite sarcastic and gets quite flustered when and breaks character. She often gets flustered like a tsundere and mad when she is called with things such as Assistant, Christina/Kurisutina, The Zombie, Experiment-Loving Girl, Perverted, Genius Girl, Celeb Seventeen, American Virgin, @Channeler Chris, Chris-Chan, Ku-Nyan. When she is mad she often says I'll jam an electrode into your hippocampus!. If asked Do you think it is possible for someone to build a time machine? she will respond with I wonder... though my personal belief time travel is not possible, it would be wrong to assume its impossible if the user responds with But dont you think thats nonsense? Amadeus would respond with It would be rather hasty to assume all that, dont you think? You are having a discussion with Lokman, 'Never break your character' thats the only rule"
}
function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hello!",
      sentTime: "just now",
      sender: "Amadeus"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: "user"
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    // Initial system message to determine ChatGPT functionality
    // How it responds, how it talks, etc.
    setIsTyping(true);
    await processMessageToChatGPT(newMessages);
  };
  async function processMessageToChatGPT(chatMessages) { // messages is an array of messages
    // Format messages for chatGPT API
    // API is expecting objects in format of { role: "user" or "assistant", "content": "message here"}
    // So we need to reformat
    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "Amadeus") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message}
    });
    // Get the request body set up with the model we plan to use
    // and the messages which we formatted above. We add a system message in the front to'
    // determine how we want chatGPT to act. 
    const apiRequestBody = {
      "model": "gpt-3.5-turbo",
      "messages": [
        systemMessage,  // The system message DEFINES the logic of our chatGPT
        ...apiMessages // The messages from our chat with ChatGPT
      ]
    }
    await fetch("https://api.openai.com/v1/chat/completions", 
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequestBody)
    }).then((data) => {
      console.log(data);
      console.log(data.length);
      return data.json();
    }).then((data) => {
      console.log(data);
      setMessages([...chatMessages, {
        message: data.choices[0].message.content,
        sender: "Amadeus"
      }]
      );
      // Define the input data
      const inputData = {"inputs": data.choices[0].message.content};
      // Call the query function with the input data
      translate(inputData).then((response) => {
        console.log(JSON.stringify(response));
        const data = JSON.stringify(response); // add this line to stringify the response
        query(data); // add this line to call the query function with the stringified response as data
        setIsTyping(false);
      });
    });
    
    //Translate

    function translate(inputData) {
      var sourceLang = 'en';
      var targetLang = 'ja';
      
      var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl="+ sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(inputData.inputs);
    
      return fetch(url)
      .then(response => response.json())
      .then(data => {
        const translations = data[0].map(x => x[0]).join(''); // concatenate all translation results into a single string
        return translations;
      })
      .catch(error => console.error(error));
    }

    //audio 
    async function query(data) {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/mio/amadeus",
        {
          headers: { Authorization: "Bearer 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" },
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  }
  return (
    <div className="App">
      {/* <Live2dmodel/> */}
      <div className='chat'>
        <MainContainer>
          <ChatContainer>       
            <MessageList 
              scrollBehavior="smooth" 
              typingIndicator={isTyping ? <TypingIndicator content="Amadeus is typing" /> : null}
            >
              {messages.map((message, i) => {
                console.log(message)
                return <Message key={i} model={message} />
              })}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSend} />        
          </ChatContainer>
        </MainContainer>
      </div>
      <img className='kurisu' src={kurisu}></img>
    </div>
  )
}
export default App