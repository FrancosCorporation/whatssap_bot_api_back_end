from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import time
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC



# Caminho para o driver do Chrome
servico = Service('files/chromedriver.exe')  # Atualize com seu caminho local
driver = webdriver.Chrome(service=servico)

# Abre o site no navegador
url = "https://torrentsdosfilmes.to/"
driver.get(url)

# Aguarda o Cloudflare resolver o desafio
time.sleep(10)  # pode ajustar conforme necessário

# Pega o HTML carregado
html = driver.page_source

# Espera até que a div com classe 'post green' apareça (até 10 segundos)
wait = WebDriverWait(driver, 10)
post = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.post.green")))

# Faz o parsing com BeautifulSoup
soup = BeautifulSoup(html, 'html.parser')
post = soup.find('div', class_='post green')

if post:
    print(post.prettify())
else:
    print("Div com classe 'post green' não encontrada.")

driver.quit()
