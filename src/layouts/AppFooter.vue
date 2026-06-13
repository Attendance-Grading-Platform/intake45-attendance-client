<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="w-full border-t border-neutral-300 bg-white px-8 py-4 flex items-center justify-between flex-wrap gap-2" aria-label="Site footer">

    <!-- Left -->
    <div class="flex items-center gap-2">
      <span class="font-serif text-[15px] text-brand-red select-none">ITI</span>
      <span class="w-px h-3.5 bg-neutral-300" aria-hidden="true" />
      <p class="font-sans text-label text-neutral-400 tracking-widest uppercase">
        Information Technology Institute &copy; {{ currentYear }}
      </p>
    </div>

    <!-- Right -->
    <p class="font-sans text-label text-neutral-400 tracking-widest uppercase">
      Attendance &amp; Grading Platform
    </p>

  </footer>
</template>