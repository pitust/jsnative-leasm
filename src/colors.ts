import colors from './colormaps.json';
export { Scopes } from './color-libs';
/**
 * 
 * @param s The string
 * @example colorPrint("{keyword:let} {variable:a} {keyword.operator.assignment:=} 3;")
 */
export function colorPrint(s: string) {
    return s.replace(/{[a-z\.]+:[^}]+}/g, (m) => {
        let [key, ...textSplit] = m.slice(1, -1).split(':');
        let text = textSplit.join(':');
        let v = '\x1b[0m\x1b[38;2;';
        v += colors.tokenColors.find(e => e.scope.includes(key)).settings.foreground.slice(1).split(/(..)/).filter(e => e).map(e => parseInt(e, 16)).join(';')
        v += 'm';
        v += text;
        v += '\x1b[0m';
        return v;
    })
}
let a = 3;
console.log(colorPrint("{keyword:let} {variable.other.readwrite:a} {keyword.operator.assignment:=} {constant.numeric:3};"))