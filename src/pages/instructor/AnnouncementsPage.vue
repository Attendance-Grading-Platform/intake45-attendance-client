<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { getCohorts } from '@/api/modules/cohort.api'
import { getInstructorAnnouncements, createAnnouncement } from '@/api/modules/announcement.api'

const authStore = useAuthStore()

// ── State ───────────────────────────────────────────────────────────────
const isCheckingWindow = ref(true)

const isWithinEngagementWindow = computed(() => {
  if (!authStore.user || authStore.user.role !== 'instructor') return true // admins can always publish
  const endDate = authStore.user.engagement_end_date
  if (!endDate) return false
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  return today <= end
})

const cohorts = ref<any[]>([])
const selectedCohortId = ref<number | ''>('')

const title = ref('')

const isPublishing = ref(false)
const publishError = ref<string | null>(null)

// History Table State
const history = ref<any[]>([])
const isLoadingHistory = ref(true)

// Local Storage Key
const DRAFT_STORAGE_KEY = 'instructor_announcement_draft'

// ── Editor Setup ────────────────────────────────────────────────────────
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      // We only want bold, italic, and bullet lists
      heading: false,
      code: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      strike: false,
    }),
    Placeholder.configure({
      placeholder: 'Write your announcement here...',
    }),
  ],
  content: '',
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px] px-4 py-3',
    },
  },
})

// ── Initialization ──────────────────────────────────────────────────────
onMounted(async () => {
  try {
    // If past engagement window, lock the editor
    if (!isWithinEngagementWindow.value && editor.value) {
      editor.value.setEditable(false)
    }

    // 2. Fetch allowed cohorts
    const cohortsRes = await getCohorts()
    cohorts.value = cohortsRes.data.data

    // 3. Load history
    loadHistory()

    // 4. Load Draft from LocalStorage
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        if (parsed.title) title.value = parsed.title
        if (parsed.cohort_id) selectedCohortId.value = parsed.cohort_id
        if (parsed.body && editor.value) editor.value.commands.setContent(parsed.body)
      } catch (e) {
        // ignore bad JSON
      }
    }
  } finally {
    isCheckingWindow.value = false
  }
})

// ── Actions ─────────────────────────────────────────────────────────────
const loadHistory = async () => {
  isLoadingHistory.value = true
  try {
    const res = await getInstructorAnnouncements(1)
    history.value = res.data.data.data || res.data.data
  } catch (err) {
    console.error('Failed to load history', err)
  } finally {
    isLoadingHistory.value = false
  }
}

const saveDraft = () => {
  if (!editor.value) return
  const draftData = {
    title: title.value,
    cohort_id: selectedCohortId.value,
    body: editor.value.getHTML(),
  }
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData))
  alert('Draft saved locally.')
}

const clearDraft = () => {
  localStorage.removeItem(DRAFT_STORAGE_KEY)
}

const publishAnnouncement = async () => {
  if (!isWithinEngagementWindow.value) return
  if (!selectedCohortId.value) {
    publishError.value = 'Please select a cohort.'
    return
  }
  if (!title.value.trim()) {
    publishError.value = 'Please enter a title.'
    return
  }
  if (!editor.value || editor.value.isEmpty) {
    publishError.value = 'Please enter the announcement body.'
    return
  }

  isPublishing.value = true
  publishError.value = null

  try {
    await createAnnouncement({
      cohort_id: Number(selectedCohortId.value),
      title: title.value.trim(),
      body: editor.value.getHTML(),
    })
    
    // Clear form and draft
    title.value = ''
    selectedCohortId.value = ''
    editor.value.commands.clearContent()
    clearDraft()

    // Refresh history
    await loadHistory()

    alert('Announcement published successfully!')
  } catch (err: any) {
    publishError.value = err.response?.data?.message || 'Failed to publish announcement.'
  } finally {
    isPublishing.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto min-h-[calc(100vh-56px)]">
    <!-- Header -->
    <div class="mb-8 flex justify-between items-end">
      <div>
        <h3 class="font-sans text-label uppercase tracking-widest text-neutral-500 mb-1">
          Communication
        </h3>
        <h1 class="font-serif text-h1 text-neutral-900">Announcements Editor</h1>
      </div>
    </div>

    <!-- ENG-5 Warning Lock -->
    <div
      v-if="!isCheckingWindow && !isWithinEngagementWindow"
      class="mb-6 rounded-md border border-amber-300 bg-amber-50 p-4"
    >
      <div class="flex items-center gap-3">
        <svg class="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <h3 class="font-sans text-base font-semibold text-amber-800">Publishing Disabled</h3>
          <p class="font-sans text-sm text-amber-700">You can only post announcements while your instructor engagement window is active. You may still save drafts locally.</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
      <!-- ─── Left Column (Editor) ──────────────────────────────────────── -->
      <div class="lg:col-span-2 space-y-6">
        <div class="rounded-card border border-neutral-300 bg-neutral-0 p-6 flex flex-col h-full shadow-sm">
          
          <!-- Publish Error -->
          <div v-if="publishError" class="mb-4 rounded bg-danger-light p-3 text-sm text-danger border border-danger">
            {{ publishError }}
          </div>

          <!-- Cohort Select -->
          <div class="mb-5">
            <label class="block text-sm font-medium text-neutral-700 mb-1">Target Cohort</label>
            <select
              v-model="selectedCohortId"
              :disabled="!isWithinEngagementWindow"
              class="w-full rounded-btn border-neutral-300 bg-neutral-50 px-3 py-2 text-sm shadow-sm focus:border-brand-red focus:ring-brand-red disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <option value="" disabled>Select a cohort...</option>
              <option v-for="cohort in cohorts" :key="cohort.id" :value="cohort.id">
                {{ cohort.name }}
              </option>
            </select>
          </div>

          <!-- Title Input -->
          <div class="mb-5 border-b border-neutral-200 pb-2">
            <input
              v-model="title"
              type="text"
              placeholder="Announcement Title"
              :disabled="!isWithinEngagementWindow"
              class="w-full border-none bg-transparent font-serif text-3xl font-bold text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0 disabled:opacity-60"
            />
          </div>

          <!-- TipTap Toolbar -->
          <div class="flex items-center gap-2 mb-2 bg-neutral-50 p-2 rounded-t-md border border-neutral-200 border-b-0" v-if="editor && isWithinEngagementWindow">
            <button
              @click="editor.chain().focus().toggleBold().run()"
              :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('bold'), 'text-neutral-600 hover:bg-neutral-200': !editor.isActive('bold') }"
              class="p-1.5 rounded transition-colors"
              title="Bold"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"></path></svg>
            </button>
            <button
              @click="editor.chain().focus().toggleItalic().run()"
              :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('italic'), 'text-neutral-600 hover:bg-neutral-200': !editor.isActive('italic') }"
              class="p-1.5 rounded transition-colors"
              title="Italic"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4-4m-8 0l-4 4"></path></svg>
            </button>
            <div class="w-px h-5 bg-neutral-300 mx-1"></div>
            <button
              @click="editor.chain().focus().toggleBulletList().run()"
              :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('bulletList'), 'text-neutral-600 hover:bg-neutral-200': !editor.isActive('bulletList') }"
              class="p-1.5 rounded transition-colors"
              title="Bullet List"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>

          <!-- Editor Content -->
          <div
            class="flex-1 border rounded-b-md border-neutral-200 bg-white"
            :class="{ 'opacity-60 cursor-not-allowed bg-neutral-50 rounded-t-md': !isWithinEngagementWindow }"
          >
            <editor-content :editor="editor" />
          </div>

          <!-- Actions -->
          <div class="mt-6 flex items-center justify-between">
            <button
              @click="saveDraft"
              class="text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              Save Draft Locally
            </button>
            <button
              @click="publishAnnouncement"
              :disabled="!isWithinEngagementWindow || isPublishing"
              class="bg-brand-red text-white px-6 py-2.5 rounded-btn font-semibold text-sm transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <span v-if="isPublishing">Publishing...</span>
              <span v-else>Post Announcement</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ─── Right Column (Guide) ─────────────────────────────────────── -->
      <div class="lg:col-span-1">
        <div class="rounded-card border border-neutral-300 bg-neutral-50 p-6 sticky top-24">
          <h3 class="font-sans text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Publishing Guide
          </h3>
          <ul class="space-y-4 text-sm text-neutral-600 font-sans">
            <li class="flex items-start gap-2">
              <span class="text-brand-red mt-0.5">•</span>
              <span><strong>Active Session Required:</strong> You can only publish announcements while an engagement session is currently running.</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-brand-red mt-0.5">•</span>
              <span><strong>Local Drafts:</strong> Clicking "Save Draft" stores your text securely in your browser so you don't lose your work.</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-brand-red mt-0.5">•</span>
              <span><strong>Formatting:</strong> Keep formatting simple. Use bold for emphasis and bullet points for lists.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ─── History Table ────────────────────────────────────────────────── -->
    <div class="rounded-card border border-neutral-300 bg-neutral-0 shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-neutral-200">
        <h3 class="font-sans text-h3 text-neutral-900">Announcement History</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-neutral-50 border-b border-neutral-200">
              <th class="py-3 px-6 font-sans text-xs uppercase tracking-wider text-neutral-500 font-semibold">Title</th>
              <th class="py-3 px-6 font-sans text-xs uppercase tracking-wider text-neutral-500 font-semibold">Cohort</th>
              <th class="py-3 px-6 font-sans text-xs uppercase tracking-wider text-neutral-500 font-semibold">Date Published</th>
              <th class="py-3 px-6 font-sans text-xs uppercase tracking-wider text-neutral-500 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr v-if="isLoadingHistory">
              <td colspan="4" class="px-6 py-8 text-center text-neutral-400 animate-pulse">
                <div class="flex flex-col items-center gap-2">
                  <div class="h-4 w-1/3 bg-neutral-200 rounded"></div>
                  <div class="h-4 w-1/4 bg-neutral-200 rounded"></div>
                </div>
              </td>
            </tr>
            <tr v-else-if="history.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-sm text-neutral-500">
                You haven't published any announcements yet.
              </td>
            </tr>
            <tr v-for="item in history" :key="item.id" class="hover:bg-neutral-50 transition-colors">
              <td class="py-4 px-6 font-sans text-sm font-medium text-neutral-900">
                {{ item.title }}
              </td>
              <td class="py-4 px-6 font-sans text-sm text-neutral-600">
                {{ item.cohort?.name || '-' }}
              </td>
              <td class="py-4 px-6 font-sans text-sm text-neutral-500">
                {{ formatDate(item.published_at) }}
              </td>
              <td class="py-4 px-6 text-right">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Published
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style>
/* TipTap Base Styling overrides for prose */
.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
.ProseMirror {
  outline: none !important;
}
</style>
