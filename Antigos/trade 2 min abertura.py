import pandas as pd

def to_float(x):
    if isinstance(x, str):
        return float(x.replace('.', '').replace(',', '.'))
    return float(x)

# Carrega o arquivo com dados históricos
df = pd.read_csv('./Antigos/winfut1min.csv', sep=';', encoding='latin1')

# Converte colunas
df['datetime'] = pd.to_datetime(df['Data'] + ' ' + df['Hora'], dayfirst=True)
df = df.sort_values('datetime')
df['date'] = df['datetime'].dt.date

# Converte preços
for col in ['Abertura', 'Máximo', 'Mínimo', 'Fechamento']:
    df[col] = df[col].apply(to_float)

resultados = []

for date, group in df.groupby('date'):
    c00 = group[group['Hora'] == '09:00:00']
    c01 = group[group['Hora'] == '09:01:00']
    c02 = group[group['Hora'] == '09:02:00']

    if c00.empty or c01.empty or c02.empty:
        continue

    open_2min = c00.iloc[0]['Abertura']
    close_2min = c01.iloc[0]['Fechamento']
    high_2min = max(c00.iloc[0]['Máximo'], c01.iloc[0]['Máximo'])
    low_2min = min(c00.iloc[0]['Mínimo'], c01.iloc[0]['Mínimo'])

    entry_price = c02.iloc[0]['Abertura']
    direction = 'buy' if close_2min > open_2min else 'sell'

    # Calcula tamanho da barra ajustado com base na direção
    if direction == 'buy':
        tamanho_barra_pts = (entry_price - low_2min) * 1000
        stop_valor_pts = tamanho_barra_pts + 60
        stop_pts = entry_price * 1000 - stop_valor_pts
        take_pts = entry_price * 1000 + 1000
    else:
        tamanho_barra_pts = (high_2min - entry_price) * 1000
        stop_valor_pts = tamanho_barra_pts + 60
        stop_pts = entry_price * 1000 + stop_valor_pts
        take_pts = entry_price * 1000 - 1000

    resultado = None

    candles_apos = group[group['datetime'] > c02.iloc[0]['datetime']]

    for _, row in candles_apos.iterrows():
        high_c_pts = row['Máximo'] * 1000
        low_c_pts = row['Mínimo'] * 1000

        if direction == 'buy':
            if low_c_pts <= stop_pts:
                resultado = stop_pts - entry_price * 1000
                break
            elif high_c_pts >= take_pts:
                resultado = 1000
                break
        else:
            if high_c_pts >= stop_pts:
                resultado = entry_price * 1000 - stop_pts
                break
            elif low_c_pts <= take_pts:
                resultado = 1000
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

# Cria DataFrame final
df_result = pd.DataFrame(resultados)

# Exibe estatísticas no terminal
print(df_result)
print('\n🔢 Total de pontos:', round(df_result['Resultado_pontos'].sum(), 2))
print('📊 Média por dia:', round(df_result['Resultado_pontos'].mean(), 2))
print('✅ Taxa de acerto:', round((df_result['Resultado_pontos'] > 0).mean() * 100, 2), '%')

# Salva relatório detalhado em TXT
with open('resultado_estrategia.txt', 'w') as f:
    for _, row in df_result.iterrows():
        f.write(f"{row['Data']} | {row['Direcao']} | Entrada: {row['Entrada']} | Stop: {row['Stop']} | Take: {row['Take']} | Resultado: {row['Resultado_pontos']} pontos\n")

print("\n📁 Arquivo 'resultado_estrategia.txt' salvo com sucesso.")
