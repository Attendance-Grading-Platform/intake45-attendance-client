<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useCohorts } from '@/composables/useCohorts'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import TextInput from '@/components/forms/TextInput.vue'
import SubmitButton from '@/components/forms/SubmitButton.vue'

const router = useRouter()
const {
    cohorts,
    tracks,
    trackAdmins,
    loadingCohorts,
    loadingTracks,
    loadingAdmins,
    creating,
    closing,
    formError,
    fieldErrors,
    cohortsError,
    fetchAll,
    createCohort,
    closeCohort,
    trackHasActiveCohort
} = useCohorts()

// --- Form State ---
const form = reactive({
    track_id: null as number | null,
    name: '',
    started_at: dayjs().format('YYYY-MM-DD'),
    ended_at: null as string | null,
    admin_ids: [] as number[],
})

const adminSearch = ref('')
const showAdminDropdown = ref(false)

// --- Table Filters ---
const filters = reactive({
    search: '',
    trackId: 'all' as number | 'all',
    status: 'all' as 'all' | 'active' | 'closed'
})

// --- Internal State ---
const activeWarning = computed(() => {
    if (!form.track_id) return null
    return trackHasActiveCohort(form.track_id) ? '⚠ This track already has an active cohort' : null
})

const filteredTrackAdmins = computed(() => {
    const search = adminSearch.value.toLowerCase()
    return trackAdmins.value.filter(a => 
        !form.admin_ids.includes(a.id) && 
        (a.name.toLowerCase().includes(search) || a.email.toLowerCase().includes(search))
    )
})

const selectedAdminObjects = computed(() => 
    trackAdmins.value.filter(a => form.admin_ids.includes(a.id))
)

const filteredCohortsCount = computed(() => {
    return cohorts.value.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(filters.search.toLowerCase())
        const matchesTrack = filters.trackId === 'all' || c.track.id === filters.trackId
        const matchesStatus = filters.status === 'all' || c.status === filters.status
        return matchesSearch && matchesTrack && matchesStatus
    }).length
})

const displayedCohorts = computed(() => {
    return cohorts.value.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(filters.search.toLowerCase())
        const matchesTrack = filters.trackId === 'all' || c.track.id === filters.trackId
        const matchesStatus = filters.status === 'all' || c.status === status
        return matchesSearch && matchesTrack && matchesStatus
    })
})

// Re-implement filtering locally for simplicity in template
const filteredRows = computed(() => {
    return cohorts.value.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(filters.search.toLowerCase())
        const matchesTrack = filters.trackId === 'all' || c.track.id === filters.trackId
        const matchesStatus = filters.status === 'all' || c.status === filters.status
        return matchesSearch && matchesTrack && matchesStatus
    })
})

// --- Validation ---
const isFormValid = computed(() => {
    return !!form.track_id && 
           form.name.length >= 3 && 
           !!form.started_at && 
           form.admin_ids.length > 0 &&
           (!form.ended_at || dayjs(form.ended_at).isAfter(dayjs(form.started_at)))
})

// --- Actions ---
async function handleCreate() {
    if (!isFormValid.value || form.track_id === null) return
    try {
        await createCohort({
            ...form,
            track_id: form.track_id as number,
            ended_at: form.ended_at || null
        })
        // Reset form
        Object.assign(form, {
            track_id: null,
            name: '',
            started_at: dayjs().format('YYYY-MM-DD'),
            ended_at: null,
            admin_ids: []
        })
        // Scroll to table
        document.getElementById('cohorts-table')?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
        // Error handled in composable
    }
}

const cohortToClose = ref<any>(null)
function confirmClose(cohort: any) {
    cohortToClose.value = cohort
}

async function handleClose() {
    if (!cohortToClose.value) return
    try {
        await closeCohort(cohortToClose.value.id)
        cohortToClose.value = null
    } catch (err) {}
}

function removeAdmin(id: number) {
    form.admin_ids = form.admin_ids.filter(aid => aid !== id)
}

function selectAdmin(id: number) {
    form.admin_ids.push(id)
    adminSearch.value = ''
    showAdminDropdown.value = false
}

onMounted(fetchAll)
</script>

<template>
  <div class="min-h-screen bg-brand-surface p-6 font-sans text-neutral-800">
    
    <!-- Header -->
    <div class="mb-8">
      <p class="text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-1 font-sans">
        Administration — Cohorts
      </p>
      <h1 class="text-[36px] font-serif leading-tight">Cohorts Setup</h1>
      <hr class="mt-3 border-t border-[#C9BDB8]" />
    </div>

    <!-- Create Form Section -->
    <div class="max-w-4xl mb-12">
      <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
        <h2 class="text-[18px] font-sans font-medium mb-6">Create New Cohort</h2>

        <form @submit.prevent="handleCreate" class="space-y-6">
          
          <!-- Track & Name Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] text-neutral-500 uppercase tracking-[1.5px]">
                Track <span class="text-brand-red">*</span>
              </label>
              <div class="relative">
                <select 
                  v-model="form.track_id"
                  class="w-full h-input px-3 rounded-input border border-[#C9BDB8] bg-white focus:outline-none focus:border-brand-red text-sm appearance-none"
                  :disabled="loadingTracks"
                >
                  <option :value="null" disabled>Select a track</option>
                  <option v-for="t in tracks" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">▼</div>
              </div>
              <p v-if="activeWarning" class="text-xs text-warning mt-1">{{ activeWarning }}</p>
            </div>

            <TextInput
              v-model="form.name"
              label="Cohort Name"
              placeholder="e.g. Web — Intake 46"
              required
              :error="fieldErrors.name"
            />
          </div>

          <!-- Dates Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] text-neutral-500 uppercase tracking-[1.5px]">
                Start Date <span class="text-brand-red">*</span>
              </label>
              <input 
                type="date" 
                v-model="form.started_at"
                class="h-input px-3 rounded-input border border-[#C9BDB8] bg-white focus:outline-none focus:border-brand-red text-sm"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] text-neutral-500 uppercase tracking-[1.5px]">
                End Date (Optional)
              </label>
              <input 
                type="date" 
                v-model="form.ended_at"
                class="h-input px-3 rounded-input border border-[#C9BDB8] bg-white focus:outline-none focus:border-brand-red text-sm"
              />
            </div>
          </div>

          <!-- Track Admins Multi-select -->
          <div class="flex flex-col gap-1.5 relative">
            <label class="text-[11px] text-neutral-500 uppercase tracking-[1.5px]">
              Assign Track Admin(s) <span class="text-brand-red">*</span>
            </label>
            <div class="relative">
              <input 
                type="text"
                v-model="adminSearch"
                placeholder="Search and select Track Admins"
                @focus="showAdminDropdown = true"
                class="w-full h-input px-3 rounded-input border border-[#C9BDB8] bg-white focus:outline-none focus:border-brand-red text-sm"
              />
              <!-- Dropdown -->
              <div v-if="showAdminDropdown && filteredTrackAdmins.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-[#C9BDB8] rounded-input max-h-48 overflow-y-auto shadow-sm">
                <div 
                  v-for="admin in filteredTrackAdmins" 
                  :key="admin.id"
                  @click="selectAdmin(admin.id)"
                  class="p-3 hover:bg-brand-surface cursor-pointer text-sm"
                >
                  <p class="font-medium">{{ admin.name }}</p>
                  <p class="text-xs text-neutral-500">{{ admin.email }}</p>
                </div>
              </div>
            </div>
            <!-- chips -->
            <div class="flex flex-wrap gap-2 mt-2">
              <div v-for="admin in selectedAdminObjects" :key="admin.id" class="flex items-center gap-1.5 bg-brand-surface text-brand-red px-2 py-1 rounded-md text-xs border border-brand-red/20 font-medium">
                {{ admin.name }}
                <button @click="removeAdmin(admin.id)" class="hover:text-[#7a0002] text-sm">×</button>
              </div>
            </div>
          </div>

          <!-- Error Banners -->
          <div v-if="formError" class="p-3 bg-brand-red/10 border border-brand-red/20 rounded-md text-sm text-brand-red">
            {{ formError }}
            <a v-if="formError.includes('active cohort')" href="#cohorts-table" class="ml-2 underline font-medium">View existing cohorts ↓</a>
          </div>

          <SubmitButton 
            text="Create Cohort"
            :loading="creating"
            :disabled="!isFormValid || creating"
            block
          />
        </form>
      </div>
    </div>

    <!-- Table Section -->
    <div id="cohorts-table" class="bg-white rounded-[10px] border border-[#C9BDB8] p-6 mb-24">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-3">
          <h2 class="text-[18px] font-sans font-medium">All Cohorts</h2>
          <span class="px-2 py-0.5 bg-brand-surface text-brand-red rounded-full text-[10px] font-bold">
            {{ cohorts.length }}
          </span>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-3">
          <input 
            type="text" 
            v-model="filters.search"
            placeholder="Search by name..."
            class="h-[34px] px-3 rounded-[6px] border border-[#C9BDB8] text-sm focus:outline-none focus:border-brand-red w-48"
          />
          <select v-model="filters.trackId" class="h-[34px] px-3 rounded-[6px] border border-[#C9BDB8] text-sm focus:outline-none">
            <option value="all">All Tracks</option>
            <option v-for="t in tracks" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <select v-model="filters.status" class="h-[34px] px-3 rounded-[6px] border border-[#C9BDB8] text-sm focus:outline-none">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-[11px] text-neutral-500 uppercase tracking-[1.5px] border-b border-[#C9BDB8]">
              <th class="py-3 text-left font-normal">Cohort Name</th>
              <th class="py-3 text-left font-normal">Track</th>
              <th class="py-3 text-center font-normal">Status</th>
              <th class="py-3 text-center font-normal">Students</th>
              <th class="py-3 text-left font-normal">Track Admins</th>
              <th class="py-3 text-left font-normal">Started</th>
              <th class="py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          
          <!-- Loading -->
          <tbody v-if="loadingCohorts">
            <tr v-for="i in 5" :key="i" class="animate-pulse border-b border-[#C9BDB8]">
              <td class="py-4"><div class="h-4 w-32 bg-neutral-100 rounded"></div></td>
              <td class="py-4"><div class="h-4 w-24 bg-neutral-100 rounded"></div></td>
              <td class="py-4 flex justify-center"><div class="h-5 w-16 bg-neutral-100 rounded-full"></div></td>
              <td class="py-4"><div class="h-4 w-8 mx-auto bg-neutral-100 rounded"></div></td>
              <td class="py-4"><div class="h-4 w-24 bg-neutral-100 rounded"></div></td>
              <td class="py-4"><div class="h-4 w-24 bg-neutral-100 rounded"></div></td>
              <td class="py-4"><div class="h-8 w-16 ml-auto bg-neutral-100 rounded"></div></td>
            </tr>
          </tbody>

          <!-- Success -->
          <tbody v-else>
            <tr v-for="cohort in filteredRows" :key="cohort.id" class="hover:bg-brand-surface transition-colors border-b border-[#C9BDB8]">
              <td class="py-4 font-medium text-neutral-900">{{ cohort.name }}</td>
              <td class="py-4 text-neutral-600">{{ cohort.track?.name ?? '—' }}</td>
              <td class="py-4 text-center">
                <span 
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                  :class="cohort.status === 'active' ? 'bg-[#D1FAE5] text-[#2D6A4F]' : 'bg-neutral-100 text-neutral-500'"
                >
                  {{ cohort.status }}
                </span>
              </td>
              <td class="py-4 text-center font-medium">{{ cohort.students_count }}</td>
              <td class="py-4 text-neutral-600 max-w-[150px] truncate">
                {{ (cohort.track_admins ?? []).map((a: any) => a.name).slice(0, 2).join(', ') }}
                <span v-if="(cohort.track_admins ?? []).length > 2" class="text-[10px] font-bold text-brand-red ml-1">+{{ cohort.track_admins.length - 2 }} more</span>
              </td>
              <td class="py-4 text-neutral-600">{{ dayjs(cohort.started_at).format('MMM D, YYYY') }}</td>
              <td class="py-4 text-right flex items-center justify-end gap-3">
                <router-link 
                  :to="{ name: 'branch-manager-cohort-detail', params: { cohortId: cohort.id } }"
                  class="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View
                </router-link>
                <button 
                  v-if="cohort.status === 'active'"
                  @click="confirmClose(cohort)"
                  class="px-2 py-1 text-[11px] border border-brand-red text-brand-red rounded hover:bg-brand-red hover:text-white transition-colors"
                >
                  Close
                </button>
              </td>
            </tr>

            <!-- Empty states -->
            <tr v-if="cohorts.length === 0">
              <td colspan="7" class="py-12 text-center">
                <div class="text-4xl mb-4">📂</div>
                <p class="text-neutral-500">No cohorts created yet. Create your first cohort using the form above.</p>
              </td>
            </tr>
            <tr v-else-if="filteredRows.length === 0">
              <td colspan="7" class="py-12 text-center text-neutral-500">
                No cohorts match your filters. 
                <button @click="Object.assign(filters, {search: '', trackId: 'all', status: 'all'})" class="text-brand-red underline ml-1">Clear filters</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dialogs -->
    <ConfirmDialog
      v-if="cohortToClose"
      :open="!!cohortToClose"
      :title="'Close ' + cohortToClose.name"
      :message="'Are you sure you want to close \'' + cohortToClose.name + '\'? Students will lose access and this cannot be undone.'"
      confirm-label="Close Cohort"
      :loading="closing"
      @confirm="handleClose"
      @cancel="cohortToClose = null"
    />
  </div>
</template>

<style scoped>
/* Standard Select Appearance Reset */
select {
  background-image: none;
}
</style>
