#include "header.hpp"
leasm::nilbox<string> native_number_tostring_impl() {
    leasm::fatal("native_number_tostring_impl() not impled");
    asm volatile("ud2");
    while (1) {
    }
}
leasm::nilbox<number> native_fromraw_impl(leasm::ctype_cdouble v) {
    auto box = leasm::heap::allocate<number>();
    box.val.get()->_int = std::shared_ptr<uint32_t>((uint32_t*)malloc(sizeof(uint32_t)));
    *box.val.get()->_int.get() = (uint32_t)v;
    return box;
}
void log_impl(leasm::nilbox<number> box) {
    printf("Int: %d\n", (int)(*box.val.get()->_int.get()));
}
void _start();
int main() {
    _start();
}