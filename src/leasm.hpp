#include <stdlib.h>

#include <cstdio>
#include <memory>
#ifndef _LEASM_HPP
#define _LEASM_HPP
namespace leasm {
typedef double ctype_cdouble;
template <typename T, typename U>
constexpr size_t offsetof_impl(T const* t, U T::*a) {
    return (char const*)t - (char const*)&(t->*a) >= 0 ? (char const*)t - (char const*)&(t->*a) : (char const*)&(t->*a) - (char const*)t;
}

#define leasm_offsetof(Type_, Attr_) \
    leasm::offsetof_impl((Type_ const*)nullptr, &Type_::Attr_)

template <typename T>
class nilbox {
   public:
    std::shared_ptr<T> val;

    nilbox();
    inline void wrbox(auto val) {
        *this->val = *val.val.get();
    }
    inline std::shared_ptr<void> get_attr(uint32_t id) {
        return this->val.get()->get_val(id);
    }
};
template <typename T>
class fcn {
   public:
    std::shared_ptr<T> val;

    inline fcn() {
        this->val = std::shared_ptr<T>((T*)malloc(sizeof(T)));
    }
    inline void wrbox(auto val) {
        *this->val = *((T*)(val.get()));
    }
    inline std::shared_ptr<void> get_attr(uint32_t id) {
        return this->val.get().get_offsetoff();
    }
};

template <typename T>
inline nilbox<T>::nilbox() {
    this->val = std::shared_ptr<T>((T*)malloc(sizeof(T)));
}
template<>
inline nilbox<void>::nilbox() {
    this->val = (std::shared_ptr<void>)std::shared_ptr<uint64_t>((uint64_t*)malloc(8));
}
inline void fatal(const char* err) {
    std::printf("Fatal: %s\n", err);
    std::exit(1);
}
namespace heap {
template <typename T>
inline nilbox<T> allocate() {
    return nilbox<T>();
}
}  // namespace heap
}  // namespace leasm
#endif