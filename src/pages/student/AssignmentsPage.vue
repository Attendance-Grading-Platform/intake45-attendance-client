<template>
  <div class="w-full font-sans text-gray-900">

    <header class="mb-10">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav class="flex items-center gap-2.5 mb-5 text-[11px] font-bold tracking-widest uppercase">
            <span class="text-gray-400">Academic Portal</span>
            <span class="text-gray-300">/</span>
            <span class="text-red-700">My Assignments</span>
          </nav>
          <h1 class="font-serif text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
            My Assignments
          </h1>
          <p class="text-gray-500 mt-3 text-sm lg:text-base max-w-xl leading-relaxed">
            Manage your upcoming deliverables, track missing work, and review instructor feedback.
          </p>
        </div>

        <div class="hidden sm:flex items-center gap-3.5 text-right">
          <div class="flex flex-col justify-center">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Current Session</span>
            <span class="text-sm font-semibold text-gray-900">Fall Semester 2026</span>
          </div>
          <div class="size-11 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
            <span class="text-red-700 font-bold text-sm font-serif">ITI</span>
          </div>
        </div>
      </div>
    </header>

    <div class="mb-8 border-b border-gray-200">
      <div class="flex gap-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="group relative pb-3 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-4 rounded-t"
          :class="activeTab === tab.id ? 'text-red-700' : 'text-gray-400 hover:text-gray-800'"
        >
          <div class="flex items-center gap-2">
            {{ tab.label }}
            <span
              v-if="tab.count !== undefined"
              class="inline-flex items-center justify-center px-1.5 min-w-[20px] h-5 rounded-full text-[10px] font-bold transition-colors"
              :class="activeTab === tab.id ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'"
            >
              {{ tab.count }}
            </span>
          </div>
          
          <div 
            class="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full transition-all duration-300"
            :class="activeTab === tab.id ? 'bg-red-700 opacity-100' : 'bg-gray-200 opacity-0 group-hover:opacity-100'"
          ></div>
        </button>
      </div>
    </div>

    <div class="w-full">
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 min-h-[500px]">
         <LoadingSpinner class="size-10 text-red-700" />
         <p class="mt-4 text-sm text-gray-500 font-medium">Fetching assignments...</p>
      </div>
      <template v-else>

      <div v-if="activeTab === 'active'" class="flex flex-col lg:flex-row gap-6 h-[calc(100vh-300px)] min-h-[520px] animate-fade-in">

        <div class="flex-1 flex flex-col min-w-0 bg-stone-50/50 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100/80 bg-white/50 backdrop-blur-sm">
            <h2 class="font-serif text-lg font-bold text-gray-900">Upcoming Deadlines</h2>
          </div>
          
          <div class="flex flex-col gap-4 overflow-y-auto p-5 h-full board-scroll">
            <div
              v-for="task in activeTasks"
              :key="task.id"
              class="group bg-white border border-gray-200 rounded-xl p-6 hover:border-red-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <p class="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">{{ task.course }}</p>
              <h3 class="font-serif text-lg font-bold text-gray-900 mb-5 leading-snug group-hover:text-red-800 transition-colors">{{ task.title }}</h3>

              <div class="flex flex-col gap-2.5 mb-6">
                <div class="flex items-center gap-2.5 text-sm text-gray-600">
                  <svg class="size-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Due: <span class="font-semibold text-gray-900">{{ task.dueDate }}</span></span>
                </div>
                <div class="flex items-center gap-2.5 text-sm text-gray-600">
                  <svg class="size-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>Max Points: <span class="font-semibold text-gray-900">{{ task.maxPoints }}</span></span>
                </div>
              </div>

              <div class="border-t border-gray-100 pt-5">
                <button @click.stop="toggleSubmission(task.id)" class="w-full bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-xs font-bold py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 shadow-sm">
                  {{ submittingTaskId === task.id ? 'Cancel Submission' : 'Open Submission' }}
                </button>
                <div v-if="submittingTaskId === task.id" class="mt-4 animate-fade-in" @click.stop>
                  <AssignmentSubmission @submit-payload="handleSubmission" :is-submitting="isSubmitting" />
                </div>
              </div>
            </div>

            <div v-if="activeTasks.length === 0" class="flex flex-col items-center justify-center h-48 text-center rounded-xl border-2 border-dashed border-gray-200 bg-white/50">
              <svg class="size-8 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <p class="text-sm font-medium text-gray-500">All caught up!</p>
            </div>
          </div>
        </div>

        <div class="flex-1 flex flex-col min-w-0 bg-red-50/30 rounded-2xl border border-red-100/60 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-6 py-5 border-b border-red-100 bg-red-50/50 backdrop-blur-sm">
            <h2 class="font-serif text-lg font-bold text-red-800 flex items-center gap-2.5">
              <svg class="size-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Missed Deadlines
            </h2>
          </div>
          
          <div class="flex flex-col gap-4 overflow-y-auto p-5 h-full board-scroll-red">
            <div
              v-for="task in overdueTasks"
              :key="task.id"
              class="group bg-white border-l-[3px] border-l-red-600 border border-gray-200 rounded-r-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex justify-between items-start mb-3">
                <p class="text-[10px] font-bold tracking-widest text-red-600/80 uppercase">{{ task.course }}</p>
                <span class="bg-red-50 text-red-700 border border-red-100 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Overdue</span>
              </div>
              <h3 class="font-serif text-lg font-bold text-gray-900 mb-4 leading-snug">{{ task.title }}</h3>

              <div class="bg-red-50/80 rounded-lg p-3.5 border border-red-100/80 mb-5">
                <p class="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-1">Penalty Applied</p>
                <p class="text-xs text-red-800/90 leading-relaxed">
                  Submission is <span class="font-bold">{{ task.daysLate }} days</span> past due. A 25% daily deduction is being applied.
                </p>
              </div>

              <div class="flex justify-between items-center text-xs text-gray-500 mb-5">
                <span>Was Due: <span class="text-red-700 font-medium">{{ task.wasDue }}</span></span>
                <span>Max: <span class="font-medium text-gray-700">{{ task.maxPoints }} pts</span></span>
              </div>

              <button @click.stop="toggleSubmission(task.id)" class="w-full bg-white border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 text-xs font-bold py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                {{ submittingTaskId === task.id ? 'Cancel' : 'Submit Late' }}
              </button>
              <div v-if="submittingTaskId === task.id" class="mt-4 animate-fade-in" @click.stop>
                <AssignmentSubmission @submit-payload="handleSubmission" :is-submitting="isSubmitting" />
              </div>
            </div>

            <div v-if="overdueTasks.length === 0" class="flex flex-col items-center justify-center h-48 text-center rounded-xl border-2 border-dashed border-red-100/50 bg-white/40">
              <svg class="size-8 text-red-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <p class="text-sm font-medium text-red-400">No missed deadlines.</p>
            </div>
          </div>
        </div>

      </div>

      <div v-if="activeTab === 'past_due'" class="animate-fade-in">
        <div class="mb-8 p-5 bg-red-50/80 border border-red-100 rounded-xl flex items-start gap-4">
          <svg class="size-6 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 class="font-bold text-red-900 text-sm">Action Required</h4>
            <p class="text-sm text-red-800/90 mt-1 leading-relaxed max-w-3xl">
              The following assignments have exceeded their deadlines. Upload immediately to minimize your rolling late penalties.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="task in overdueTasks"
            :key="'pd-' + task.id"
            class="group bg-white border border-gray-200 hover:border-red-200 rounded-xl shadow-sm p-6 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div class="flex justify-between items-start mb-3">
              <p class="text-[10px] font-bold tracking-widest text-red-500 uppercase">{{ task.course }}</p>
              <span class="bg-red-50 text-red-700 border border-red-100 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Overdue</span>
            </div>
            <h3 class="font-serif text-lg font-bold text-gray-900 mb-2">{{ task.title }}</h3>
            <p class="text-xs text-red-600/80 italic font-medium mb-6 flex-grow">Late Penalty: -25% per day applied.</p>

            <div class="flex justify-between items-center text-xs text-gray-500 mb-5 pt-5 border-t border-gray-100">
              <span>Was Due: <span class="text-red-700 font-medium">{{ task.wasDue }}</span></span>
              <span class="font-medium">{{ task.maxPoints }} pts</span>
            </div>

            <button @click.stop="toggleSubmission(task.id)" class="w-full bg-white border border-gray-200 text-red-700 hover:border-red-300 hover:bg-red-50 text-xs font-bold py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              {{ submittingTaskId === task.id ? 'Cancel' : 'Submit Late' }}
            </button>
            <div v-if="submittingTaskId === task.id" class="mt-4 animate-fade-in" @click.stop>
              <AssignmentSubmission @submit-payload="handleSubmission" :is-submitting="isSubmitting" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'completed'" class="animate-fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="task in completedTasks"
            :key="task.id"
            class="group bg-white border border-gray-200 hover:border-gray-300 rounded-xl shadow-sm p-6 flex flex-col transition-all duration-300"
          >
            <div class="flex justify-between items-start mb-4">
              <p class="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{{ task.course }}</p>
              
              <span
                v-if="task.status === 'graded'"
                class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider"
              >Graded</span>
              <span
                v-else
                class="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider"
              >Submitted</span>
            </div>

            <h3 class="font-serif text-lg font-bold text-gray-900 mb-5 leading-snug">{{ task.title }}</h3>

            <div class="flex justify-between items-end mb-6">
              <div class="flex items-center gap-2 text-sm text-gray-600 min-w-0 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                <svg class="size-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span class="truncate text-xs font-medium">{{ task.submittedFile }}</span>
              </div>
              
              <div v-if="task.grade !== null" class="text-right shrink-0 ml-4">
                <span class="text-[9px] text-gray-400 block uppercase tracking-widest mb-1">Final Score</span>
                <span class="font-serif text-3xl font-bold text-gray-900 leading-none">
                  {{ task.grade }} <span class="text-sm font-sans text-gray-400 font-normal ml-0.5">/{{ task.maxPoints }}</span>
                </span>
              </div>
            </div>

            <div v-if="task.feedback" class="bg-stone-50 rounded-lg p-4 border border-stone-200/60 mt-auto">
              <p class="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                <svg class="size-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Instructor Feedback
              </p>
              <p class="text-xs text-gray-600 italic leading-relaxed">"{{ task.feedback }}"</p>
            </div>
            
            <div class="mt-5 pt-5 border-t border-gray-100 text-center">
              <button class="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-700 transition-colors focus:outline-none">
                View Details
                <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
// @ts-ignore
import AssignmentSubmission from '@/components/student/AssignmentSubmission.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';

const activeTab = ref('active');
const isLoading = ref(true);
const isSubmitting = ref(false);
const submittingTaskId = ref<number | null>(null);

const activeTasks = ref<any[]>([]);
const overdueTasks = ref<any[]>([]);
const completedTasks = ref<any[]>([]);

const toggleSubmission = (id: number) => {
  submittingTaskId.value = submittingTaskId.value === id ? null : id;
};

const fetchAssignments = async () => {
  isLoading.value = true;
  try {
    const response = await api.get('/v1/me/deliverables');
    const assignments = response.data?.data || response.data || [];
    
    activeTasks.value = [];
    overdueTasks.value = [];
    completedTasks.value = [];

    const now = new Date();

    assignments.forEach((task: any) => {
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      
      const formattedDate = dueDate 
          ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(dueDate)
          : 'No due date';

      const mappedTask = {
        id: task.id || task.course_component_id,
        course: task.course?.name || task.course_name || 'UNKNOWN COURSE',
        title: task.title || task.name || 'Assignment',
        dueDate: formattedDate,
        wasDue: formattedDate,
        rawDueDate: dueDate,
        maxPoints: task.maxPoints || task.raw_max || 100,
        daysLate: dueDate ? Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))) : 0,
        status: task.status,
        grade: task.grade || task.raw_score,
        feedback: task.feedback,
        submittedFile: task.submitted_file || task.submission_url || 'Submission',
      };

      if (task.status === 'graded' || task.status === 'submitted') {
        completedTasks.value.push(mappedTask);
      } else if (dueDate && dueDate < now) {
        overdueTasks.value.push(mappedTask);
      } else {
        activeTasks.value.push(mappedTask);
      }
    });
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleSubmission = async (formData: FormData) => {
  if (!submittingTaskId.value) return;
  
  isSubmitting.value = true;
  try {
    const backendPayload = new FormData();
    backendPayload.append('course_component_id', submittingTaskId.value.toString());
    
    if (formData.has('url')) backendPayload.append('submission_url', formData.get('url') as string);
    if (formData.has('file')) backendPayload.append('submission_file', formData.get('file') as Blob);

    await api.post('/v1/me/deliverables', backendPayload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const moveTask = (sourceArray: any[]) => {
      const index = sourceArray.findIndex(t => t.id === submittingTaskId.value);
      if (index !== -1) {
        const task = sourceArray.splice(index, 1)[0];
        task.status = 'submitted';
        const fileEntry = formData.get('file') as File | null;
        task.submittedFile = fileEntry ? fileEntry.name : (formData.get('url') as string);
        completedTasks.value.push(task);
        return true;
      }
      return false;
    };

    if (!moveTask(activeTasks.value)) {
      moveTask(overdueTasks.value);
    }

    console.log('Submission successful');
    alert('Assignment submitted successfully!');
    submittingTaskId.value = null;
  } catch (error) {
    console.error('Submission error', error);
    alert('Failed to submit assignment. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchAssignments();
});

const tabs = computed(() => [
  { id: 'active', label: 'Active Tasks', count: activeTasks.value.length },
  { id: 'past_due', label: 'Past Due', count: overdueTasks.value.length },
  { id: 'completed', label: 'Completed', count: completedTasks.value.length },
]);
</script>

<style scoped>
/* Board column scrollbar – neutral */
.board-scroll::-webkit-scrollbar {
  width: 5px;
}
.board-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.board-scroll::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 99px;
}
.board-scroll::-webkit-scrollbar-thumb:hover {
  background-color: #d1d5db;
}

/* Board column scrollbar – red tint */
.board-scroll-red::-webkit-scrollbar {
  width: 5px;
}
.board-scroll-red::-webkit-scrollbar-track {
  background: transparent;
}
.board-scroll-red::-webkit-scrollbar-thumb {
  background-color: #fca5a5;
  border-radius: 99px;
}
.board-scroll-red::-webkit-scrollbar-thumb:hover {
  background-color: #f87171;
}

/* Transitions */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>