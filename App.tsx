import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ToolbarIcon, type ToolbarIconName } from './src/ToolbarIcon';
import { hasDrawnGlyph, KeyArtwork } from './src/KeyArtwork';
import { EmailSendModal } from './src/EmailSendModal';
import { diceImages, type DiceImageName } from './src/diceImages';
import { diceImageNameFor } from './src/dicePair';
import { appendDecimal, appendDigit, appendOperator, backspace, evaluateExpression, formatResult, toggleParenthesis } from './src/calculator';

type Tool = 'history' | 'converter' | 'scientific' | null;
type HistoryItem = { expression: string; result: string };
type DiceSelection = { entered: string; imageName: DiceImageName };

const COLOR = {
  black: '#000000', divider: '#282828', white: '#f0f0f2',
  muted: '#929296', green: '#79d43f', equal: '#369900', red: '#fb6969', caret: '#a2d9d9',
};
const ROWS = [
  ['C', '()', '%', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'],
  ['1', '2', '3', '+'], ['+/−', '0', ',', '='],
] as const;

function CalculatorScreen() {
  const { width, height } = useWindowDimensions();
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tool, setTool] = useState<Tool>(null);
  const [emailVisible, setEmailVisible] = useState(false);
  const [diceSelection, setDiceSelection] = useState<DiceSelection | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [conversionValue, setConversionValue] = useState('1');
  const [conversionUnit, setConversionUnit] = useState<'cm' | 'm' | 'km'>('cm');

  const keypadWidth = Math.min(width, 500);
  const keySize = Math.min((keypadWidth - 88) / 4, (height * 0.52 - 32) / 5);
  const keyGap = Math.min(16, (keypadWidth - 40 - keySize * 4) / 3);
  const preview = useMemo(() => {
    if (!expression || justEvaluated) return null;
    const result = evaluateExpression(expression);
    return result === null ? null : formatResult(result);
  }, [expression, justEvaluated]);

  function pressKey(key: string) {
    if (key === '+/−') {
      setEmailVisible(true);
      return;
    }
    if (key === 'C') {
      setExpression('');
      setJustEvaluated(false);
      return;
    }
    if (key === '=') {
      if (expression === '0000') {
        setTestMode((active) => !active);
        setDiceSelection(null);
        setExpression('');
        setJustEvaluated(false);
        return;
      }
      if (testMode) {
        const imageName = diceImageNameFor(expression);
        if (imageName !== null) {
          setDiceSelection({ entered: expression, imageName });
          setJustEvaluated(true);
          return;
        }
      }
      const result = evaluateExpression(expression);
      if (result !== null) {
        const formatted = formatResult(result);
        setHistory((items) => [{ expression, result: formatted }, ...items].slice(0, 50));
        setExpression(formatted);
        setJustEvaluated(true);
      }
      return;
    }
    setExpression((current) => {
      const base = justEvaluated && (/^\d$/.test(key) || key === ',' || key === '()') ? '' : current;
      if (/^\d$/.test(key)) {
        if (key === '0' && /^0{1,3}$/.test(base)) return `${base}0`;
        if (key !== '0' && /^0+$/.test(base)) return key;
        return appendDigit(base, key);
      }
      if (key === ',') return appendDecimal(base);
      if (key === '()') return toggleParenthesis(base);
      if (key === '%') return base && /[\d)]$/.test(base) ? `${base}%` : base;
      return appendOperator(base, key);
    });
    setJustEvaluated(false);
  }

  function pressScientific(key: string) {
    if (key === 'π') {
      setExpression((current) => `${current}${current && /[\d)%]$/.test(current) ? '×' : ''}${Math.PI.toString().replace('.', ',')}`);
    } else {
      const value = evaluateExpression(expression);
      if (value === null) return;
      const next = key === '√' ? Math.sqrt(value) : key === 'x²' ? value ** 2 :
        key === 'sin' ? Math.sin(value * Math.PI / 180) :
        key === 'cos' ? Math.cos(value * Math.PI / 180) : Math.tan(value * Math.PI / 180);
      if (Number.isFinite(next)) setExpression(formatResult(next));
    }
    setJustEvaluated(false);
    setTool(null);
  }

  const toolbar: { icon: ToolbarIconName; label: string; action: () => void }[] = [
    { icon: 'history', label: 'Histórico', action: () => setTool('history') },
    { icon: 'ruler', label: 'Conversor de unidades', action: () => setTool('converter') },
    { icon: 'scientific', label: 'Funções científicas', action: () => setTool('scientific') },
    { icon: 'backspace', label: 'Apagar último caractere', action: () => { setExpression((current) => backspace(current)); setJustEvaluated(false); } },
  ];
  const conversionNumber = Number(conversionValue.replace(',', '.')) || 0;
  const meters = conversionUnit === 'cm' ? conversionNumber / 100 : conversionUnit === 'km' ? conversionNumber * 1000 : conversionNumber;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.display}>
          <View style={styles.expressionLine}>
            <Text
              style={[styles.expression, { fontSize: expression.length > 13 ? 35 : 52 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              accessibilityLabel={expression || 'Visor vazio'}
            >{expression}</Text>
            {!expression && <View style={styles.caret} />}
          </View>
          {preview && <Text style={styles.preview} numberOfLines={1}>= {preview}</Text>}
        </View>

        <View style={[styles.toolbar, { maxWidth: keypadWidth }]}>
          {toolbar.map(({ icon, label, action }) => (
            <Pressable key={icon} style={[styles.toolbarButton, icon === 'backspace' && styles.backspaceButton]} onPress={action} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}>
              <ToolbarIcon name={icon} color={icon === 'backspace' ? '#315b25' : COLOR.muted} />
            </Pressable>
          ))}
        </View>
        <View style={[styles.divider, { maxWidth: keypadWidth - 40 }]} />

        <View style={[styles.keypad, { width: keypadWidth, marginTop: 30 }]}>
          {ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.keyRow, { gap: keyGap, marginBottom: rowIndex === 4 ? 0 : 8 }]}>
              {row.map((key) => {
                const drawn = hasDrawnGlyph(key);
                const fontSize = key === 'C' ? keySize * 0.43 : keySize * 0.47;
                return (
                  <Pressable
                    key={key}
                    onPress={() => pressKey(key)}
                    accessibilityRole="button"
                    accessibilityLabel={key === '()' ? 'Parênteses' : key === '+/−' ? 'Enviar imagem por e-mail' : key}
                    style={({ pressed }) => [styles.key, { width: keySize, height: keySize, borderRadius: keySize / 2 }, pressed && { opacity: 0.78 }]}
                  >
                    <KeyArtwork label={key} size={keySize} />
                    {!drawn && <Text allowFontScaling={false} style={[styles.keyText, { fontSize, color: key === 'C' ? COLOR.red : COLOR.white }]}>{key}</Text>}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <Modal visible={tool !== null} transparent animationType="fade" onRequestClose={() => setTool(null)} statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTool(null)} accessibilityLabel="Fechar" />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{tool === 'history' ? 'Histórico' : tool === 'converter' ? 'Conversor de comprimento' : 'Funções científicas'}</Text>
              <Pressable onPress={() => setTool(null)} accessibilityRole="button" accessibilityLabel="Fechar"><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            {tool === 'history' && <ScrollView style={styles.historyList}>
              {history.length === 0 ? <Text style={styles.emptyText}>Nenhum cálculo ainda</Text> : history.map((item, index) => (
                <Pressable key={`${item.expression}-${index}`} style={styles.historyItem} onPress={() => { setExpression(item.result); setTool(null); setJustEvaluated(true); }}>
                  <Text style={styles.historyExpression}>{item.expression}</Text>
                  <Text style={styles.historyResult}>= {item.result}</Text>
                </Pressable>
              ))}
            </ScrollView>}
            {tool === 'converter' && <View style={styles.converterContent}>
              <Text style={styles.sheetLabel}>Valor</Text>
              <Text style={styles.converterValue}>{conversionValue}</Text>
              <View style={styles.unitRow}>{(['cm', 'm', 'km'] as const).map((unit) => (
                <Pressable key={unit} onPress={() => setConversionUnit(unit)} style={[styles.unitChip, conversionUnit === unit && styles.selectedChip]}>
                  <Text style={[styles.unitText, conversionUnit === unit && styles.selectedUnitText]}>{unit}</Text>
                </Pressable>
              ))}</View>
              <View style={styles.conversionResults}>
                <Text style={styles.conversionResult}>{formatResult(meters * 100)} cm</Text>
                <Text style={styles.conversionResult}>{formatResult(meters)} m</Text>
                <Text style={styles.conversionResult}>{formatResult(meters / 1000)} km</Text>
              </View>
              <View style={styles.converterKeyboard}>{['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', ','].map((key) => (
                <Pressable key={key} style={styles.converterKey} onPress={() => setConversionValue((current) => key === 'C' ? '0' : key === ',' ? appendDecimal(current) : appendDigit(current === '0' ? '' : current, key))}>
                  <Text style={styles.converterKeyText}>{key}</Text>
                </Pressable>
              ))}</View>
            </View>}
            {tool === 'scientific' && <View style={styles.scientificGrid}>{['sin', 'cos', 'tan', '√', 'x²', 'π'].map((key) => (
              <Pressable key={key} style={styles.scientificKey} onPress={() => pressScientific(key)}><Text style={styles.scientificKeyText}>{key}</Text></Pressable>
            ))}</View>}
          </View>
        </View>
      </Modal>
      <Modal visible={testMode && diceSelection !== null} transparent animationType="fade" onRequestClose={() => setDiceSelection(null)} statusBarTranslucent>
        <SafeAreaView style={styles.diceModal} edges={['top', 'bottom']}>
          <View style={styles.diceHeader}>
            <Text style={styles.diceTitle}>Resultado {diceSelection?.entered}</Text>
            <Pressable onPress={() => setDiceSelection(null)} accessibilityRole="button" accessibilityLabel="Fechar imagem" hitSlop={12}>
              <Text style={styles.diceClose}>×</Text>
            </Pressable>
          </View>
          {diceSelection && <Image
            source={diceImages[diceSelection.imageName]}
            style={styles.diceImage}
            resizeMode="contain"
            accessibilityLabel={`Imagem dos dados ${diceSelection.entered}`}
          />}
        </SafeAreaView>
      </Modal>
      <EmailSendModal visible={emailVisible} onClose={() => setEmailVisible(false)} />
    </SafeAreaView>
  );
}

export default function App() { return <SafeAreaProvider><CalculatorScreen /></SafeAreaProvider>; }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLOR.black },
  screen: { flex: 1, backgroundColor: COLOR.black, alignItems: 'center', paddingBottom: 14 },
  display: { flex: 1, width: '100%', paddingHorizontal: 34, paddingTop: 50, alignItems: 'flex-end' },
  expressionLine: { width: '100%', minHeight: 54, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  expression: { color: COLOR.white, fontWeight: '300', textAlign: 'right', flexShrink: 1, includeFontPadding: false },
  caret: { width: 2, height: 47, backgroundColor: COLOR.caret },
  preview: { marginTop: 10, color: COLOR.muted, fontSize: 30, fontWeight: '300', includeFontPadding: false },
  toolbar: { width: '100%', height: 76, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center' },
  toolbarButton: { width: 60, height: 62, justifyContent: 'center', alignItems: 'center' },
  backspaceButton: { width: 62, marginLeft: 'auto' },
  divider: { width: '100%', height: 1, backgroundColor: COLOR.divider },
  keypad: { paddingHorizontal: 20 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  key: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  keyText: { fontWeight: '300', includeFontPadding: false, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#151515', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { color: COLOR.white, fontSize: 22, fontWeight: '600' },
  closeText: { color: COLOR.muted, fontSize: 32, lineHeight: 34 },
  historyList: { maxHeight: 380 },
  emptyText: { color: COLOR.muted, textAlign: 'center', paddingVertical: 34, fontSize: 16 },
  historyItem: { borderBottomWidth: 1, borderBottomColor: '#303030', paddingVertical: 14, alignItems: 'flex-end' },
  historyExpression: { color: COLOR.muted, fontSize: 17 },
  historyResult: { color: COLOR.white, fontSize: 25, marginTop: 3 },
  sheetLabel: { color: COLOR.muted, fontSize: 15 },
  converterContent: { paddingBottom: 4 },
  converterValue: { color: COLOR.white, fontSize: 38, marginTop: 6 },
  unitRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  unitChip: { backgroundColor: '#282828', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 7 },
  selectedChip: { backgroundColor: COLOR.equal },
  unitText: { color: COLOR.white, fontSize: 16 },
  selectedUnitText: { fontWeight: '700' },
  conversionResults: { gap: 9, marginTop: 20, marginBottom: 16 },
  conversionResult: { color: COLOR.white, fontSize: 19 },
  converterKeyboard: { flexDirection: 'row', flexWrap: 'wrap' },
  converterKey: { width: '33.33%', alignItems: 'center', paddingVertical: 10 },
  converterKeyText: { color: COLOR.green, fontSize: 24 },
  scientificGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  scientificKey: { width: '30%', backgroundColor: '#292929', borderRadius: 20, alignItems: 'center', paddingVertical: 16 },
  scientificKeyText: { color: COLOR.green, fontSize: 21 },
  diceModal: { flex: 1, backgroundColor: COLOR.black },
  diceHeader: { minHeight: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 },
  diceTitle: { color: COLOR.white, fontSize: 20, fontWeight: '600' },
  diceClose: { color: COLOR.white, fontSize: 34, lineHeight: 40 },
  diceImage: { flex: 1, width: '100%' },
});
