import { writeFileSync } from 'fs';
export class BaseCodeEmitter {
    gen: string[] = [];
    tabLevel = 0;
    tabs = '';
    wtab(fcn: (this: this) => void) {
        this.tabLevel++;
        this.tabs = '    '.repeat(this.tabLevel);
        fcn.apply(this);
        this.tabLevel--;
        this.tabs = '    '.repeat(this.tabLevel);
    }
    emit(s: string, ...args: string[]) {
        this.gen.push(this.tabs + s.replace(/{}/g, () => args.shift()));
    }
    pprint() {
        let len = this.gen.length.toString().length;
        this.gen.map((e, i) => {
            console.log(` ${(i + 1).toString().padStart(len)}  ${e}`)
        })
    }
    writeTo(file: string) {
        writeFileSync(file, this.gen.join('\n'))
    }
}
