chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  id: "translate",
  title: "Translate Selected Text",
  contexts: ["selection"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate" && info.selectionText) {
    handleTranslation(info.selectionText, tab.id);
  }
});

async function handleTranslation(textToTranslate, tabId) {
  const {apiKey, prompt, model} = await new Promise((resolve) => {
    chrome.storage.local.get(["apiKey", "prompt", "model"], (result) => {
      resolve({
        apiKey: result?.apiKey || null,
        prompt: result?.prompt || "將下面的話翻譯成中文，如果原文是中文，則翻譯成英文。如果原文是其他語言，則翻譯成中文。",
        model: result?.model || "gemini-2.5-flash"
      });
    });
  });

  if (!apiKey) {
    messageBox("請先配置 API 密鑰", tabId);
    return;
  }

  const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{text: prompt}],
      },
      {
        role: "user",
        parts: [{text: textToTranslate}],
      },
    ],
  };

  try {
    messageBox("翻譯中...", tabId);

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let firstFlag = 1;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.substring(6));
          if (data?.candidates || null) {
            const parts = data.candidates[0]?.content?.parts || [];
            let translatedText = "";
            parts.forEach((part) => {
                translatedText += part?.text || "";
            });
            if (firstFlag) {
                messageBox(translatedText, tabId);
                firstFlag = 0;
            } else {
                updateMessageBox(translatedText, tabId);
            }
          }
        }
      }
    }
  } catch (error) {
    messageBox("翻譯請求失敗，請檢查您的網絡或 API 密鑰。 err: "+error.toString(), tabId);
  }
}

function messageBox(message, tabId, isLive = false) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (msg, live) => {
      let div = document.getElementById("translate-popup");
      if (!div) {
        div = document.createElement("div");
        div.id = "translate-popup";
        div.style.position = "fixed";
        div.style.top = "5px";
        div.style.right = "200px";
        div.style.backgroundColor = "white";
        div.style.color = "black";
        div.style.padding = "15px";
        div.style.border = "1px solid #ccc";
        div.style.borderRadius = "8px";
        div.style.boxShadow = "0px 4px 8px rgba(0,0,0,0.2)";
        div.style.zIndex = "9999";
        div.style.minWidth = "300px";
        div.style.maxWidth = "600px";
        div.style.maxHeight = "90%";
        div.style.fontFamily = "Arial, sans-serif";
        div.style.overflowY = "auto";

        const text = document.createElement("p");
        text.id = "translate-popup-text";
        text.style.margin = "0";
        text.style.fontSize = "12px";
        div.appendChild(text);

        const closeButton = document.createElement("button");
        closeButton.textContent = "x";
        closeButton.style.position = "absolute";
        closeButton.style.top = "5px";
        closeButton.style.right = "0px";
        closeButton.style.border = "none";
        closeButton.style.background = "transparent";
        closeButton.style.color = "black";
        closeButton.style.fontSize = "16px";
        closeButton.style.cursor = "pointer";
        closeButton.title = "Close";
        closeButton.onclick = () => div.remove();
        div.appendChild(closeButton);

        document.body.appendChild(div);
      }

      const textElement = document.getElementById("translate-popup-text");
      if (live) {
        textElement.textContent += msg;
      } else {
        textElement.textContent = msg;
      }
    },
    args: [message, isLive],
  });
}

function updateMessageBox(partialMessage, tabId) {
  messageBox(partialMessage, tabId, true);
}
