document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("api-key");
  const promptInput = document.getElementById("prompt");
  const saveButton = document.getElementById("save-btn");
  const resetButton = document.getElementById("reset-btn");

  chrome.storage.local.get(["apiKey", "prompt"], (data) => {
    apiKeyInput.value = data.apiKey || "";
    promptInput.value = data.prompt || "";
  });

  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    const prompt = promptInput.value.trim();

    if (!apiKey) {
      alert("請輸入 API 密鑰！");
      return;
    }

    chrome.storage.local.set({ apiKey, prompt }, () => {
      alert("保存成功！");
    });
  });

  resetButton.addEventListener("click", () => {
    chrome.storage.local.remove(["apiKey", "prompt"], () => {
      apiKeyInput.value = "";
      promptInput.value = "";
      alert("重置成功！");
    });
  });
});
