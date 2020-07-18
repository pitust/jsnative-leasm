export enum NodeType {
    GlobalDef = 1,
    FuncDecl = 2,
    Func = 3,
    Type = 4
}

export type Type = string | ['array', string] | ['or', Type[]];
export type Instr = { opcode: 'call' | 'br' | 'bt' | 'mov' | 'get' | 'label' | 'assignnull' | 'getarg' | 'clear', args: string[], si?: Type };
export interface Node {
    type: NodeType;
    attr: AnyAttr[];
    ops: Instr[];
    args: string[];
}
export interface DeclAttr {
    type: 'decl';
    args: string[];
    rets: string;
}
export interface ImplAttr {
    type: 'impl';
    implAt: string;
}
export interface TypeAttr {
    type: 'type';
    typeVal: string;
}
export interface PropAttr {
    type: 'prop';
    valType: string;
    key: string;
}
export type AnyAttr = DeclAttr | ImplAttr | PropAttr | TypeAttr | { type: 'static' };

export function parse(leasm: string) {
    let data: Node[] = [];
    for (let l of leasm.split('\n')) {
        if (l.endsWith(':')) {
            let av = l.slice(0, -1).split(' ')
            let t: null | NodeType = null;
            if (av[0] == 'func') {
                t = NodeType.Func;
            }
            if (av[0] == 'type') {
                t = NodeType.Type;
            }
            if (av[0] == 'funcdecl') {
                t = NodeType.FuncDecl;
            }
            if (av[0] == 'global') {
                t = NodeType.GlobalDef;
            }
            if (t) {
                data.push({
                    type: t,
                    attr: [],
                    ops: [],
                    args: av.slice(1)
                });
            } else throw `unk: ${av[0]}`
        } else {
            let [nm, ...args] = l.trim().split(' ');

            let f = data[data.length - 1];
            if (f.type == NodeType.Func) {
                f.ops!.push({ opcode: nm as any, args });
            } else {
                if (nm == 'type') {
                    f.attr.push({ type: 'type', typeVal: args[0] })
                } else if (nm == 'decl') {
                    let argc = args[0];
                    let argv = args.slice(1).slice(0, +argc);
                    let rets = args[+argc + 1];
                    f.attr.push({ type: 'decl', args: argv, rets })
                } else if (nm == 'static') {
                    f.attr.push({ type: 'static' })
                } else if (nm == 'impl') {
                    f.attr.push({ type: 'impl', implAt: args[0] })
                } else if (nm == 'prop') {
                    f.attr.push({ type: 'prop', valType: args[1], key: args[0] })

                } else if (nm == '') {} else throw nm;
            }
        }
    }
    return data;
}
