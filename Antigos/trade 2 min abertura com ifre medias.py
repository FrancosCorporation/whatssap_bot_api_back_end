import pandas as pd
import numpy as np

def to_int(x):
    """Converte string numérica com '.' de milhar e ',' decimal para inteiro, ignorando casas decimais."""
    if isinstance(x, str):
        x = x.replace('.', '').replace(',', '.')
        try:
            return int(round(float(x)))
        except:
            return np.nan
    elif pd.isna(x):
        return np.nan
    else:
        return int(round(x))

def backtest_strategy(
    df,
    take_pontos=1900,
    buffer_stop_pontos=0,
    contratos_entry=2,
    contratos_medio=None,
    contratos_inversao1=None,
    contratos_inversao2=None,
    valor_por_ponto=0.20,
    ifr_buy_threshold=30,
    ifr_sell_threshold=70,
    media_period=20
):
    contratos_medio = contratos_medio or contratos_entry
    contratos_inversao1 = contratos_inversao1 or contratos_entry
    contratos_inversao2 = contratos_inversao2 or contratos_entry

    df = df.copy()

    # Converter colunas para inteiro (tratando NaNs)
    colunas_numericas = ['Abertura', 'Máxima', 'Mínima', 'Fechamento', 'IFR (RSI) [14]']
    for col in colunas_numericas:
        df[col] = df[col].apply(to_int)

    # Criar SMA arredondada para inteiro (Int64 permite NaN)
    df[f'SMA_{media_period}'] = df['Fechamento'].rolling(window=media_period).mean().round().astype('Int64')

    # Alias para IFR
    df['IFR_14'] = df['IFR (RSI) [14]']

    # Criar coluna date para agrupar
    df['date'] = pd.to_datetime(df['Data'], dayfirst=True).dt.date

    resultados = []

    for date, group in df.groupby('date'):
        first_candle = group.iloc[0]

        open_ = first_candle['Abertura']
        close = first_candle['Fechamento']
        high = first_candle['Máxima']
        low = first_candle['Mínima']
        sma = first_candle[f'SMA_{media_period}']
        ifr = first_candle['IFR_14']

        direction = None

        # Regras de entrada
        if pd.notna(sma) and pd.notna(ifr):
            if ifr < ifr_buy_threshold and close < open_ and close > sma:
                direction = 'buy'
            elif ifr > ifr_sell_threshold and close > open_ and close < sma:
                direction = 'sell'

        if direction is None:
            continue

        entry_price = close
        stop_pontos = int(high - low) + buffer_stop_pontos
        contratos_ativos = contratos_entry
        medio_ativo = False
        inversoes_feitas = 0

        if direction == 'buy':
            stop_price = entry_price - stop_pontos
            take_price = entry_price + take_pontos
        else:
            stop_price = entry_price + stop_pontos
            take_price = entry_price - take_pontos

        resultado = None
        high_first = high
        low_first = low

        # Candles após o primeiro (usar coluna 'datetime' que você criou)
        candles_apos = group[group['datetime'] > first_candle['datetime']]

        for _, row in candles_apos.iterrows():
            high_c = row['Máxima']
            low_c = row['Mínima']
            open_c = row['Abertura']

            # Entrada do médio
            if not medio_ativo:
                if (direction == 'buy' and high_c > high_first) or (direction == 'sell' and low_c < low_first):
                    contratos_ativos += contratos_medio
                    medio_ativo = True

            # Condições de stop, take e inversão
            if direction == 'buy':
                if low_c <= stop_price:
                    if inversoes_feitas == 0:
                        direction = 'sell'
                        entry_price = open_c
                        contratos_ativos = contratos_inversao1
                        stop_price = entry_price + stop_pontos
                        take_price = entry_price - take_pontos
                        inversoes_feitas = 1
                        medio_ativo = False
                        high_first = row['Máxima']
                        low_first = row['Mínima']
                        continue
                    elif inversoes_feitas == 1:
                        direction = 'buy'
                        entry_price = open_c
                        contratos_ativos = contratos_inversao2
                        stop_price = entry_price - stop_pontos
                        take_price = entry_price + take_pontos
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

            else:  # sell
                if high_c >= stop_price:
                    if inversoes_feitas == 0:
                        direction = 'buy'
                        entry_price = open_c
                        contratos_ativos = contratos_inversao1
                        stop_price = entry_price - stop_pontos
                        take_price = entry_price + take_pontos
                        inversoes_feitas = 1
                        medio_ativo = False
                        high_first = row['Máxima']
                        low_first = row['Mínima']
                        continue
                    elif inversoes_feitas == 1:
                        direction = 'sell'
                        entry_price = open_c
                        contratos_ativos = contratos_inversao2
                        stop_price = entry_price + stop_pontos
                        take_price = entry_price - take_pontos
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
                resultado = last_close - entry_price
            else:
                resultado = entry_price - last_close

        resultado_reais = resultado * contratos_ativos * valor_por_ponto

        resultados.append({
            'Data': str(date),
            'Direcao': direction,
            'Entrada': entry_price,
            'Stop': stop_price,
            'Take': take_price,
            'Stop_Pontos': stop_pontos,
            'Contratos_Ativos': contratos_ativos,
            'Resultado_pontos_unit': resultado,
            'Resultado_reais': round(resultado_reais, 2),
            'Inversoes': inversoes_feitas,
            'Medio_ativo': medio_ativo
        })

    df_result = pd.DataFrame(resultados)

    # Estatísticas extras
    stop_uma_vez = ((df_result['Inversoes'] == 0) & (df_result['Resultado_pontos_unit'] < 0)).sum()
    com_inversoes = (df_result['Inversoes'] > 0).sum()
    com_medio = df_result['Medio_ativo'].sum()
    medio_com_stop = ((df_result['Medio_ativo'] == True) & (df_result['Resultado_pontos_unit'] < 0)).sum()
    gain_sem_stop = ((df_result['Medio_ativo'] == False) & (df_result['Resultado_pontos_unit'] > 0)).sum()
    gain_total = (df_result['Resultado_pontos_unit'] > 0).sum()

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

    # Prints
    print(df_result)
    print("Take :", take_pontos)
    print("IFR Buy Threshold :", ifr_buy_threshold)
    print("IFR Sell Threshold :", ifr_sell_threshold)
    print('🔢 Total de pontos unitários:', df_result['Resultado_pontos_unit'].sum())
    print('💰 Total em reais:', round(df_result['Resultado_reais'].sum(), 2))
    print('📊 Média por dia (reais):', round(df_result['Resultado_reais'].mean(), 2))
    print('✅ Taxa de acerto:', round((df_result['Resultado_pontos_unit'] > 0).mean() * 100, 2), '%')

    return df_result


# --- Exemplo de uso ---
df = pd.read_csv('./Antigos/winfut15min2025ComIFReMedias.csv', sep=';', encoding='utf8')
df['datetime'] = pd.to_datetime(df['Data'], dayfirst=True)

resultados = backtest_strategy(
    df,
    take_pontos=1900,
    ifr_buy_threshold=30,
    ifr_sell_threshold=70,
    media_period=20
)
