import { BaseCodeEmitter } from './codeemitter';
import { Instr, NodeType, Type } from './parser';
import { all_attr, entry, get_attr, interpLL, parsed } from './semantic';
function typeToCXX(t: Type): string {
    if (t == 'cdouble' || t == 'cint' || t == 'cstr' || t == 'cbool') return 'leasm::ctype_' + t;
    if (typeof t == 'string') {
        if (t.startsWith('func:')) {
            return 'leasm::fcn<' + t.slice(5) + '>';
        }
        if (t.startsWith('native:')) return 'uint' + (+t.slice(7) * 8) + '_t'
        if (t == 'void') return 'void';
        return 'leasm::nilbox<' + t + '>';
    }
    if (t[0] == 'or') {
        return `leasm::or<${t[1].length}, union { ${t[1].map(typeToCXX).map((e, i) => e + ' t_' + i + ';').join(', ')} }>`;
    }
    if (t[0] == 'array') {
        return `leasm::array<${typeToCXX(t[1])}>`;
    }
}
class LLGenCodeEmitter extends BaseCodeEmitter {
    func(name: string, ops: Instr[], locals: Map<string, Type>, rtype: Type, atype: Type[]) {
        this.emit('{} {}({}) {', typeToCXX(rtype), name, atype.map(typeToCXX).join(', '));
        this.wtab(() => {
            for (let [nm, t] of locals) {
                if (nm != 'void') this.emit('{} {};', typeToCXX(t), nm);
            }
            for (let op of ops) this.gOp(op);
        })
        this.emit('}');
    }
    gOp(op: Instr) {
        switch (op.opcode) {
            case 'label':
                this.emit('{}: if(false);', op.args[0]);
                break;
            case 'assignnull':
                this.emit('{} = leasm::heap::allocate<{}>();', op.args[0], op.args[1]);
                break;
            case 'mov':
                this.emit('{}.wrbox({});', op.args[0], op.args[1]);
                break;
            case 'get':
                let [k, v] = op.args[1].split('.');
                this.emit('{}.wrbox({}.get_attr(attr::{}));', op.args[0], k, v);
                break;
            case 'call':
                if (op.args[0] == 'void') {
                    this.emit('(*{}.val.get())({});', op.args[1], op.args.slice(2).join(', '));
                } else {
                    this.emit('{}.wrbox((*{}.val.get())({}));', op.args[0], op.args[1], op.args.slice(2).join(', '));
                }
                break;
            case 'br':
                this.emit('goto {};', op.args[0]);
            default:
                this.emit('// {} | {}', op.opcode.padEnd(5), op.args.map(e => e.padStart(15)).join(' '))
        }
    }
}
export function compile(hdrfile: string, implfile: string) {

    let hdr = new LLGenCodeEmitter();
    let impl = new LLGenCodeEmitter();
    impl.emit('#include <leasm.hpp>')
    hdr.emit('#include <leasm.hpp>')
    hdr.emit('#include <stdint.h>')
    impl.emit('#include <stdint.h>')
    impl.emit('#include <header.hpp>')
    let attrs: string[] = [];
    for (let t of parsed.filter(e => e.type == NodeType.Type)) {
        for (let attr of all_attr(t, 'prop')) {
            if (!attrs.includes(attr.key)) {
                attrs.push(attr.key);
            }
        }
    }
    hdr.emit('namespace attr {');
    hdr.wtab(() => {
        hdr.emit('enum attr {');
        hdr.wtab(() => {
            for (let a of attrs) hdr.emit('{},', a);
        });
        hdr.emit('};');
    })
    hdr.emit('}');
    for (let t of parsed.filter(e => e.type == NodeType.Type)) {
        hdr.emit('class {};', t.args[0]);
    }
    for (let t of parsed.filter(e => e.type == NodeType.FuncDecl)) {
        if (get_attr(t, 'impl').implAt != 'leasm') {
            let to = get_attr(t, 'impl').implAt;
            let decl = get_attr(t, 'decl');
            hdr.emit('extern {} {}({});', typeToCXX(decl.rets), to, decl.args.map(typeToCXX).join(', '))
        }
    }
    for (let t of parsed.filter(e => e.type == NodeType.FuncDecl)) {
        if (get_attr(t, 'impl').implAt != 'leasm') {
            let to = get_attr(t, 'impl').implAt;
            let decl = get_attr(t, 'decl');
            hdr.emit('struct {} {', t.args[0]);
            hdr.wtab(() => {
                hdr.emit('{} operator()({}) {', typeToCXX(decl.rets), decl.args.map(typeToCXX).map((e, i) => `${e} t${i}`).join(', '))
                hdr.wtab(() => {
                    hdr.emit('return {}({});', to, decl.args.map((_e, i) => `t${i}`).join(', '))
                })
                hdr.emit('}');
            })
            hdr.emit('};');
        }
    }
    for (let t of parsed.filter(e => e.type == NodeType.Type)) {
        hdr.emit('class {} {', t.args[0]);
        hdr.emit('public:');
        hdr.wtab(() => {
            for (let attr of all_attr(t, 'prop')) {
                hdr.emit('std::shared_ptr<{}> {};', typeToCXX(attr.valType), attr.key);
            }
            hdr.emit('inline std::shared_ptr<void> get_val(uint32_t a1) {');
            hdr.wtab(() => {
                hdr.emit('auto a = (attr::attr) a1;');
                for (let attr of all_attr(t, 'prop')) {
                    hdr.emit('if (a == attr::{}) return (std::shared_ptr<void>)this->{};', attr.key, attr.key)
                }

                hdr.emit('leasm::fatal("Unknown attr");');
            })
            hdr.emit('}')
        })
        hdr.emit('};');
    }
    let ires = interpLL(entry, []);
    impl.func('_start', entry.ops, ires, ires.get('retval') || 'void', []);
    impl.writeTo(implfile);
    hdr.writeTo(hdrfile);
}