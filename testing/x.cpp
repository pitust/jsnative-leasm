#include <leasm.hpp>
#include <stdint.h>
#include <header.hpp>
void _start() {
    leasm::nilbox<_Number> Number;
    leasm::nilbox<_Number> r0;
    leasm::fcn<fn_log> r3;
    leasm::fcn<native_fromraw> r1;
    leasm::nilbox<number> r2;
    r0 = leasm::heap::allocate<_Number>();
    Number.wrbox(r0);
    r3.wrbox(Number.get_attr(attr::log));
    r1.wrbox(Number.get_attr(attr::_fromRaw));
    r2.wrbox((*r1.val.get())(1234));
    (*r3.val.get())(r2);
}