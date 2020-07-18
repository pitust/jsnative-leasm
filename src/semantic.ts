// This is lé asm
import { parse, NodeType, Type, AnyAttr, Node, DeclAttr, ImplAttr, TypeAttr, PropAttr } from './parser';
import stringify from 'json-stringify-deterministic';
import { readFileSync } from 'fs';
import { inspect, types } from 'util';
inspect.defaultOptions.depth = Infinity;
export let parsed = parse(readFileSync('code.leasm').toString());
function mergeToStr(t1: Type, t2: string): Type {
    if (typeof t1 == 'string') {
        if (t1 == t2) return t1;
        return ['or', [t1, t2]];
    }
    if (t1[0] == 'or') {
        if (t1[1].includes(t2)) return t1;
        return ['or', [...t1[1], t2]];
    }
    return ['or', [t1 as Type, t2 as Type] as any];
}
function merge(t1: Type, t2: Type): Type {
    if (typeof t2 == 'string') return mergeToStr(t1, t2);
    if (typeof t1 == 'string') return mergeToStr(t2, t1);
    if (t1[0] == 'or') {
        if (t1[1].map(e => stringify(e)).includes(stringify(t2))) return t1;
        return ['or', [...t1[1], t2]];
    }
    if (t2[0] == 'or') {
        if (t2[1].map(e => stringify(e)).includes(stringify(t2))) return t1;
        return ['or', [...t2[1], t1]];
    }
    return ['or', [t1, t2]];
}
export function has_attr(n: Node, attr: AnyAttr['type']): boolean {
    return !!n.attr.find(e => e.type == attr);
}
export function count_attr(n: Node, attr: AnyAttr['type']): number {
    return n.attr.filter(e => e.type == attr).length;
}
export function get_attr<T extends AnyAttr['type']>(n: Node, attr: T): AnyAttr & { type: T } {
    return n.attr.find(e => e.type == attr) as AnyAttr & { type: T };
}
export function all_attr<T extends AnyAttr['type']>(n: Node, attr: T): (AnyAttr & { type: T })[] {
    return n.attr.filter(e => e.type == attr) as unknown as (AnyAttr & { type: T })[];
}
interface FcnDecl {
    decl?: DeclAttr;
    isym: string;
}
let funcs = new Map<string, FcnDecl>();
let typeTable = new Map<string, Map<string, Type>>();
for (let n of parsed) {
    if (n.type == NodeType.FuncDecl) {
        if (has_attr(n, 'decl')) {
            funcs.set('func:' + n.args[0], {
                isym: get_attr(n, 'impl').implAt,
                decl: get_attr(n, 'decl')
            });
        } else {
            funcs.set(n.args[0], {
                isym: 'leasm_' + n.args[0]
            });
        }
    }
    if (n.type == NodeType.Type) {
        let props = all_attr(n, 'prop');
        let tm = new Map<string, string>();
        typeTable.set(n.args[0], tm);
        props.forEach(e => tm.set(e.key, e.valType));
    }
}
export function interpLL(fcn: Node, args: Type[]) {
    let localsReal = new Map<string, Type>();
    parsed.filter(e => e.type == NodeType.GlobalDef).forEach(e => {
        localsReal.set(e.args[0], get_attr(e, 'type').typeVal);
    })
    function cycle(locals:  Map<string, Type>) {
        function putt(nm: string, val: Type) {
            if (locals.has(nm)) locals.set(nm, merge(locals.get(nm)!, val));
            else locals.set(nm, val);
        }
        function doIndexTypes(type: Type, key: string): Type {
            if (typeof type == 'string') {
                return typeTable.get(type).get(key);
            } else {
                if (type[0] == 'array') {
                    if (!isNaN(+key)) {
                        return ['or', [type[1], 'null']];
                    } else {
                        return 'null';
                    }
                } else {
                    return ['or', type[1].map(e => doIndexTypes(e, key))];
                }
            }
        }
        function checkCall(to: string, args: Type[], retsTo: string) {
            if (!to.startsWith('func:')) throw new Error(`Type ${to} is not callable`);
            if (!funcs.get(to)) throw new Error(`Type ${to} does not have a callee associated with it`);
            if (funcs.get(to).decl) {
                putt(retsTo, funcs.get(to).decl.rets);
            } else {
                let node = parsed.find(e => e.type == NodeType.Func && e.args[0] == funcs.get(to).isym);
                putt(retsTo, interp(node, args));
            }
        }
        for (let op of fcn.ops) {
            if (op.opcode == 'assignnull') {
                putt(op.args[0], op.args[1]);
            } else if (op.opcode == 'mov') {
                putt(op.args[0], locals.get(op.args[1]));
            } else if (op.opcode == 'get') {
                let type = locals.get(op.args[1].split('.')[0]);
                let key = op.args[1].split('.')[1];
                putt(op.args[0], doIndexTypes(type, key));
            } else if (op.opcode == 'getarg') {
                putt(op.args[0], args[op.args[1]]);
            } else if (op.opcode == 'call') {
                let type = locals.get(op.args[1]);
                if (typeof type == 'string') {
                    checkCall(type, op.args.slice(2).map(e => locals.get(e)), op.args[0])
                } else if (type[0] == 'array') {
                    throw new Error('Type array is not callable');
                } else {
                    type[1].forEach(t => {
                        if (typeof t == 'string') {
                            checkCall(t, op.args.slice(2).map(e => locals.get(e)), op.args[0])
                        } else if (type[0] == 'array') {
                            throw new Error('Type array is not callable');
                        } else {
                            throw new Error('Nested ORs are forbidden');
                        }
                    });
                }
            } else if (op.opcode == 'clear') {
                locals.delete(op.args[0]);
            }
        }
    }
    let old = '';
    let cur = '';
    do {
        old = cur;
        cycle(localsReal);
        cur = stringify([...localsReal]);
    } while (old != cur)
    return localsReal;
}
export function interp(fcn: Node, args: Type[]) {
    let locals = interpLL(fcn, args);
    return locals.get('retval') || 'void';
}
interp(parsed.find(e => e.type == NodeType.Func && e.args[0] == '_start'), []);
export const entry = parsed.find(e => e.type == NodeType.Func && e.args[0] == '_start');
