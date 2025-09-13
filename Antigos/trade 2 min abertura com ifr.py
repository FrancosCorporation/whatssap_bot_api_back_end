import pandas as pd
import numpy as np

def to_float(x):
    if isinstance(x, str):
        return float(x.replace('.', '').replace(',', '.'))
    return float(x)

# Parâmetros editáveis
take_pontos = 1900
buffer_stop_pontos = 0
contratos_entry = 2
contratos_medio = contratos_entry #* 2
contratos_inversao1 = contratos_entry #* 2
contratos_inversao2 = contratos_entry #* 3
valor_por_ponto = 0.20
ifralto = 60
ifrbaixo = 40

# Carrega dados
df = pd.read_csv('./Antigos/winfut15min2025ComIFReMedias.csv', sep=';', encoding='utf8')
df['datetime'] = pd.to_datetime(df['Data'], dayfirst=True)
df = df.sort_values('datetime')
df['date'] = df['datetime'].dt.date

# Converte colunas numéricas
colunas_numericas = [
    'Abertura', 'Máxima', 'Mínima', 'Fechamento',
    'Média Móvel A [9]', 'Média Móvel A [21]', 'Média Móvel A [50]',
    'Média Móvel A [200]', 'VWAP D', 'IFR (RSI) [14]'
]
for col in colunas_numericas:
    df[col] = df[col].apply(to_float)

# Cálculo das médias — você já tem, mas vamos calcular SMA_14 só pra seguir o padrão do código
df['SMA_14'] = df['Fechamento'].rolling(window=14).mean()
df['IFR_14'] = df['IFR (RSI) [14]']

resultados = []

# Contadores
stop_uma_vez = 0
com_inversoes = 0
com_medio = 0
medio_com_stop = 0
gain_sem_stop = 0
gain_total = 0

for date, group in df.groupby('date'):
    first_candle = group.iloc[0]

    open_ = first_candle['Abertura']
    close = first_candle['Fechamento']
    high = first_candle['Máxima']
    low = first_candle['Mínima']

    sma = first_candle['SMA_14']
    ifr = first_candle['IFR_14']

    direction = None
    if pd.notna(sma) and pd.notna(ifr):
        if close > sma and ifr < ifralto:
            direction = 'buy'
        elif close < sma and ifr > ifrbaixo:
            direction = 'sell'
    if direction is None:
        continue

    entry_price = close
    stop_pontos = int((high - low)) + buffer_stop_pontos
    contratos_ativos = contratos_entry
    medio_ativo = False
    inversoes_feitas = 0

    if direction == 'buy':
        stop_price = entry_price - (stop_pontos / 1000)
        take_price = entry_price + (take_pontos / 1000)
    else:
        stop_price = entry_price + (stop_pontos / 1000)
        take_price = entry_price - (take_pontos / 1000)

    resultado = None
    high_first = high
    low_first = low
    candles_apos = group[group['datetime'] > first_candle['datetime']]

    for _, row in candles_apos.iterrows():
        high_c = row['Máxima']
        low_c = row['Mínima']
        open_c = row['Abertura']

        if not medio_ativo:
            if (direction == 'buy' and high_c > high_first) or (direction == 'sell' and low_c < low_first):
                contratos_ativos += contratos_medio
                medio_ativo = True

        if direction == 'buy':
            if low_c <= stop_price:
                if inversoes_feitas == 0:
                    direction = 'sell'
                    entry_price = open_c
                    contratos_ativos = contratos_inversao1
                    stop_price = entry_price + (stop_pontos / 1000)
                    take_price = entry_price - (take_pontos / 1000)
                    inversoes_feitas = 1
                    medio_ativo = False
                    high_first = row['Máxima']
                    low_first = row['Mínima']
                    continue
                elif inversoes_feitas == 1:
                    direction = 'buy'
                    entry_price = open_c
                    contratos_ativos = contratos_inversao2
                    stop_price = entry_price - (stop_pontos / 1000)
                    take_price = entry_price + (take_pontos / 1000)
                    inversoes_feitas = 2
                    medio_ativo = False
                    high_first = row['Máxima']
                    low_first = row['Mínima']
                    continue
                else:
                    resultado = -stop_pontos
                    break
            elif high_c >= take_price:
                resultado = take_pontos
                break
        else:
            if high_c >= stop_price:
                if inversoes_feitas == 0:
                    direction = 'buy'
                    entry_price = open_c
                    contratos_ativos = contratos_inversao1
                    stop_price = entry_price - (stop_pontos / 1000)
                    take_price = entry_price + (take_pontos / 1000)
                    inversoes_feitas = 1
                    medio_ativo = False
                    high_first = row['Máxima']
                    low_first = row['Mínima']
                    continue
                elif inversoes_feitas == 1:
                    direction = 'sell'
                    entry_price = open_c
                    contratos_ativos = contratos_inversao2
                    stop_price = entry_price + (stop_pontos / 1000)
                    take_price = entry_price - (take_pontos / 1000)
                    inversoes_feitas = 2
                    medio_ativo = False
                    high_first = row['Máxima']
                    low_first = row['Mínima']
                    continue
                else:
                    resultado = -stop_pontos
                    break
            elif low_c <= take_price:
                resultado = take_pontos
                break

    if resultado is None:
        last_close = group.iloc[-1]['Fechamento']
        if direction == 'buy':
            resultado = int((last_close - entry_price) * 1000)
        else:
            resultado = int((entry_price - last_close) * 1000)

    resultado_reais = resultado * contratos_ativos * valor_por_ponto

    resultados.append({
        'Data': str(date),
        'Direcao': direction,
        'Entrada': round(entry_price, 3),
        'Stop': round(stop_price, 4),
        'Take': round(take_price, 4),
        'Stop_Pontos': stop_pontos,
        'Contratos_Ativos': contratos_ativos,
        'Resultado_pontos_unit': resultado,
        'Resultado_reais': round(resultado_reais, 2),
        'Inversoes': inversoes_feitas,
        'Medio_ativo': medio_ativo
    })

    if inversoes_feitas == 1:
        stop_uma_vez += 1
    if inversoes_feitas > 0:
        com_inversoes += 1
    if medio_ativo:
        com_medio += 1
    if medio_ativo and resultado < 0:
        medio_com_stop += 1
    if inversoes_feitas == 0 and resultado > 0:
        gain_sem_stop += 1
    if resultado > 0:
        gain_total += 1

df_result = pd.DataFrame(resultados)

print(df_result)
print("Take :", take_pontos)
print("IFR Alto :", ifralto)
print("IFR Baixo :", ifrbaixo)
print('🔢 Total de pontos unitários:', df_result['Resultado_pontos_unit'].sum())
print('💰 Total em reais:', round(df_result['Resultado_reais'].sum(), 2))
print('📊 Média por dia (pontos unit.):', round(df_result['Resultado_pontos_unit'].mean(), 2))
print('📊 Média por dia (reais):', round(df_result['Resultado_reais'].mean(), 2))
print('✅ Taxa de acerto:', round((df_result['Resultado_pontos_unit'] > 0).mean() * 100, 2), '%')

print("\n📈 Estatísticas Finais:")
print(f"🔹 Stops uma vez: {stop_uma_vez}")
print(f"🔹 Operações com inversões: {com_inversoes}")
print(f"🔹 Operações que pegaram o médio: {com_medio}")
print(f"🔹 Pegaram o médio e deram Stop: {medio_com_stop}")
print(f"🔹 Foram pro Gain sem dar Stop: {gain_sem_stop}")
print(f"🔹 Total que foram pro Gain: {gain_total}")

# Salva resultado
with open('resultado.txt', 'w', encoding="utf-8") as f:
    for _, row in df_result.iterrows():
        f.write(
            f"{row['Data']} | {row['Direcao']} | Entrada: {row['Entrada']} | "
            f"Stop: {row['Stop']} | Take: {row['Take']} | Contratos: {row['Contratos_Ativos']} | "
            f"Resultado: {row['Resultado_pontos_unit']} pontos | R$ {row['Resultado_reais']} | "
            f"Inversões: {row['Inversoes']} | Médio ativo: {row['Medio_ativo']}\n"
        )
    
    f.write("\n📈 Estatísticas Finais:\n")
    f.write(f"Take: {take_pontos}\n")
    f.write(f"🔢 Total de pontos unitários: {df_result['Resultado_pontos_unit'].sum()}\n")
    f.write(f"💰 Total em reais: R$ {round(df_result['Resultado_reais'].sum(), 2)}\n")
    f.write(f"📊 Média por dia (pontos unit.): {round(df_result['Resultado_pontos_unit'].mean(), 2)}\n")
    f.write(f"📊 Média por dia (reais): R$ {round(df_result['Resultado_reais'].mean(), 2)}\n")
    f.write(f"✅ Taxa de acerto: {round((df_result['Resultado_pontos_unit'] > 0).mean() * 100, 2)}%\n")

    f.write(f"\n🔹 Stops uma vez: {stop_uma_vez}\n")
    f.write(f"🔹 Operações com inversões: {com_inversoes}\n")
    f.write(f"🔹 Operações que pegaram o médio: {com_medio}\n")
    f.write(f"🔹 Pegaram o médio e deram Stop: {medio_com_stop}\n")
    f.write(f"🔹 Foram pro Gain sem dar Stop: {gain_sem_stop}\n")
    f.write(f"🔹 Total que foram pro Gain: {gain_total}\n")
