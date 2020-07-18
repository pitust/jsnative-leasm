#include <leasm.hpp>
#include <stdint.h>
namespace attr {
    enum attr {
        _int,
        toString,
        _fromRaw,
        log,
        _ptr,
    };
}
class number;
class _Number;
class string;
extern leasm::nilbox<string> native_number_tostring_impl();
extern leasm::nilbox<number> native_fromraw_impl(leasm::ctype_cdouble);
extern void log_impl(leasm::nilbox<number>);
struct native_number_tostring {
    leasm::nilbox<string> operator()() {
        return native_number_tostring_impl();
    }
};
struct native_fromraw {
    leasm::nilbox<number> operator()(leasm::ctype_cdouble t0) {
        return native_fromraw_impl(t0);
    }
};
struct fn_log {
    void operator()(leasm::nilbox<number> t0) {
        return log_impl(t0);
    }
};
class number {
public:
    std::shared_ptr<uint32_t> _int;
    std::shared_ptr<leasm::fcn<native_number_tostring>> toString;
    inline std::shared_ptr<void> get_val(uint32_t a1) {
        auto a = (attr::attr) a1;
        if (a == attr::_int) return (std::shared_ptr<void>)this->_int;
        if (a == attr::toString) return (std::shared_ptr<void>)this->toString;
        leasm::fatal("Unknown attr");
    }
};
class _Number {
public:
    std::shared_ptr<leasm::fcn<native_fromraw>> _fromRaw;
    std::shared_ptr<leasm::fcn<fn_log>> log;
    inline std::shared_ptr<void> get_val(uint32_t a1) {
        auto a = (attr::attr) a1;
        if (a == attr::_fromRaw) return (std::shared_ptr<void>)this->_fromRaw;
        if (a == attr::log) return (std::shared_ptr<void>)this->log;
        leasm::fatal("Unknown attr");
    }
};
class string {
public:
    std::shared_ptr<uint64_t> _ptr;
    inline std::shared_ptr<void> get_val(uint32_t a1) {
        auto a = (attr::attr) a1;
        if (a == attr::_ptr) return (std::shared_ptr<void>)this->_ptr;
        leasm::fatal("Unknown attr");
    }
};