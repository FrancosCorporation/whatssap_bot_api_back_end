from llm_axe import OnlineAgent, OllamaChat

prompt = "Tell me about web scraping."
llm = OllamaChat(model="llama3:instruct")

print(OnlineAgent(llm).search(prompt))