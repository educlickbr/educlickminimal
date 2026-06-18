<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-6 font-sans relative overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[180px]" />
      <div class="absolute bottom-[0%] right-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]" />
    </div>
    <div class="w-full max-w-md relative z-10">
      <div class="bg-div-15 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
        <slot />
      </div>
    </div>
  </div>
</template>
