import pandas as pd

def to_float(x):
    if isinstance(x, str):
        return float(x.replace('.', '').replace(',', '.'))
    return float(x)

# Carrega CSV 10 minutos
df = pd.read_csv('./Antigos/winfut15min2025.csv', sep=';', encoding='latin1')

# Converte datas
df['datetime'] = pd.to_datetime(df['Data'] + ' ' + df['Hora'], dayfirst=True)
df = df.sort_values('datetime')
df['date'] = df['datetime'].dt.date

# Converte colunas numéricas
for col in ['Abertura', 'Máximo', 'Mínimo', 'Fechamento', 'Volume']:
    df[col] = df[col].apply(to_float)

take_pontos = 1900  # ajuste aqui o valor do take profit em pontos para testar

resultados = []

for date, group in df.groupby('date'):
    # Pega o primeiro candle do pregão, ex: 09:00
    first_candle = group.iloc[0]

    open_10min = first_candle['Abertura']
    close_10min = first_candle['Fechamento']
    high_10min = first_candle['Máximo']
    low_10min = first_candle['Mínimo']
    tamanho_barra_pts = (high_10min - low_10min) * 1000

    entry_price = close_10min  # Entrada no fechamento do primeiro candle do dia

    # Define direção inicial pelo candle (fechou acima da abertura? buy, senão sell)
    if close_10min > open_10min:
        direction = 'buy'
    elif close_10min < open_10min:
        direction = 'sell'
    else:
        # Se candle neutro, ignora dia
        continue

    # Stop dinâmico = tamanho barra + 10 pontos
    stop_valor_pts = tamanho_barra_pts + 10
    if direction == 'buy':
        stop_pts = entry_price * 1000 - stop_valor_pts
        take_pts = entry_price * 1000 + take_pontos
    else:
        stop_pts = entry_price * 1000 + stop_valor_pts
        take_pts = entry_price * 1000 - take_pontos

    resultado = None
    operacao_invertida = False

    candles_apos = group[group['datetime'] > first_candle['datetime']]

    for _, row in candles_apos.iterrows():
        high_c_pts = row['Máximo'] * 1000
        low_c_pts = row['Mínimo'] * 1000

        if direction == 'buy':
            if low_c_pts <= stop_pts:
                # Stop ativado, inverte operação
                if not operacao_invertida:
                    direction = 'sell'
                    entry_price = row['Abertura']
                    stop_valor_pts = tamanho_barra_pts + 10
                    stop_pts = entry_price * 1000 + stop_valor_pts
                    take_pts = entry_price * 1000 - take_pontos
                    operacao_invertida = True
                    continue
                else:
                    resultado = stop_pts - entry_price * 1000
                    break
            elif high_c_pts >= take_pts:
                resultado = take_pts - entry_price * 1000
                break

        else:  # sell
            if high_c_pts >= stop_pts:
                if not operacao_invertida:
                    direction = 'buy'
                    entry_price = row['Abertura']
                    stop_valor_pts = tamanho_barra_pts + 10
                    stop_pts = entry_price * 1000 - stop_valor_pts
                    take_pts = entry_price * 1000 + take_pontos
                    operacao_invertida = True
                    continue
                else:
                    resultado = entry_price * 1000 - stop_pts
                    break
            elif low_c_pts <= take_pts:
                resultado = entry_price * 1000 - take_pts
                break

    if resultado is None:
        last_close_pts = group.iloc[-1]['Fechamento'] * 1000
        if direction == 'buy':
            resultado = last_close_pts - entry_price * 1000
        else:
            resultado = entry_price * 1000 - last_close_pts

    resultados.append({
        'Data': str(date),
        'Direcao': direction,
        'Entrada': round(entry_price, 2),
        'Stop': round(stop_pts / 1000, 2),
        'Take': round(take_pts / 1000, 2),
        'Stop_Pontos': round(stop_valor_pts, 2),
        'Resultado_pontos': round(resultado, 2)
    })

df_result = pd.DataFrame(resultados)

print(df_result)
print("Take : "+str(take_pontos))
print('🔢 Total de pontos:', round(df_result['Resultado_pontos'].sum(), 2))
print('📊 Média por dia:', round(df_result['Resultado_pontos'].mean(), 2))
print('✅ Taxa de acerto:', round((df_result['Resultado_pontos'] > 0).mean() * 100, 2), '%')

with open('resultado.txt', 'w') as f:
    for _, row in df_result.iterrows():
        f.write(f"{row['Data']} | {row['Direcao']} | Entrada: {row['Entrada']} | Stop: {row['Stop']} | Take: {row['Take']} | Resultado: {row['Resultado_pontos']} pontos\n")

print("\n📁 Arquivo 'resultado.txt' salvo com sucesso.")
