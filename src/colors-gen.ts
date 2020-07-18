import colors from './colormaps.json';
import { BaseCodeEmitter } from './codeemitter';
class ColorsTSEmitter extends BaseCodeEmitter {
    makeScopeTypes() {
        this.emit('export type Scopes =');
        this.wtab(() => {
            for (let z of colors.tokenColors) {
                let klela = (z.scope instanceof Array ? z.scope.join(',') : z.scope);
                klela.split(',').map((e: string) => e.trim()).filter(e => e).forEach(f => {
                    this.emit('| {}', JSON.stringify(f));
                });
            }
        });
    }
}
let em = new ColorsTSEmitter();
em.makeScopeTypes();
em.writeTo('src/color-libs.ts');