let eventBus = new Vue()

Vue.component('all-notes', {
    template:`
            <div class="all-notes">
                
                <div class="firstHeader">
                    <create-note></create-note>
                </div>
                    
                <div>
                    <notes></notes>
                </div>
            </div>
    `,
})

Vue.component('notes', {
    template: `
        <div class="notes">
            <note class="notes-note" :column="columns[0]" :errors="errors" :name="nameFirst"   :columnIndex="columnIndex1" @deleteTask="deleteTask" @nextColumn="nextColumn" @redactTask="redactTask" @redSub="redSub"></note>
            <note class="notes-note" :column="columns[1]" :errors="errors" :name="nameSecond"  :columnIndex="columnIndex2" @nextColumn="nextColumn" @redactTask="redactTask" @clearTrues="clearTrues" @redSub="redSub"></note>
            <note class="notes-note" :column="columns[2]" :errors="errors" :name="nameThird"   :columnIndex="columnIndex3" @nextColumn="nextColumn" @reasonBackFun="reasonBackFun" @reasonStatusEdit="reasonStatusEdit" @redactTask="redactTask" @redSub="redSub"></note>
            <note class="notes-note" :column="columns[3]" :errors="errors" :name="nameFourth"  :columnIndex="columnIndex4"></note>
        </div>
    `,


    data() {
        return {
            columns: [
                [],
                [],
                [],
                [],
            ],

            errors: [],

            nameFirst: 'В работе',
            nameSecond: 'Тестирование',
            nameThird: 'Выполненные задачи',
            nameFourth: 'Дэдлайн',

            columnIndex1: 0,
            columnIndex2: 1,
            columnIndex3: 2,
            columnIndex4: 3,
        }
    },


    mounted(){
        eventBus.$on('check-deadline', () => {
            this.columns[3].forEach(note => {
                if (note){
                    let date1 = new Date(note.date)
                    let date2 = new Date(note.deadline)
                    if (date1 <= date2){
                        note.gg = "Успешное завершение"
                    }else{
                        note.gg = "Вы не успели в срок"
                    }
                }
            })
        })

        const savedColumns = localStorage.getItem('columns');
        if (savedColumns) {
            this.columns = JSON.parse(savedColumns);
        }

        eventBus.$on('notes-submitted', note => {
            this.columns[0].push(note);
            this.saveNotes();
        });

        eventBus.$on('clear-trues', () => {
            this.columns[1].forEach(note => {
                if (note.reasonStatus) {
                    note.reasonStatus = false;
                }
            });
        });

    },


    watch: {
        columns: {
            handler: 'saveNotes',
            deep: true,
        },
    },


    methods: {
        saveNotes() {
            localStorage.setItem('columns', JSON.stringify(this.columns));
        },
        deleteTask(task){
            this.columns[task.columnIndex].splice(task.indexNote, 1)
        },
        nextColumn(task) {
            let redTask = this.columns[task.columnIndex][task.indexNote]
            redTask.editStatus = false
            let move = this.columns[task.columnIndex].splice(task.indexNote, 1)
            this.columns[task.columnIndex+1].push(...move)
            if (task.columnIndex+1 === 3) {
                eventBus.$emit('check-deadline', move[0]);
            }
        },
        redactTask(task) {
            this.columns[task.columnIndex][task.indexNote].editStatus = !this.columns[task.columnIndex][task.indexNote].editStatus
            let redTask = this.columns[task.columnIndex][task.indexNote]
            redTask.timeForRedact = true
        },
        reasonStatusEdit(task){
            this.columns[task.columnIndex][task.indexNote].reasonStatus = !this.columns[task.columnIndex][task.indexNote].reasonStatus
        },
        reasonBackFun(task){
            if (task.columnIndex === 2) {
                if (this.columns[task.columnIndex][task.indexNote] === task.note) {
                    this.columns[task.columnIndex][task.indexNote].reason.push(task.reasonBack);

                    let move = this.columns[task.columnIndex].splice(task.indexNote, 1);
                    this.columns[task.columnIndex - 1].push(...move);

                    this.clearTrues();
                }
            }
        },
        clearTrues(task){
            eventBus.$emit('clear-trues', task)
        },
        redSub(task){
            goingRedTask = this.columns[task.columnIndex][task.indexNote]
            goingRedTask.name=task.redTaskReviw.redName
            goingRedTask.desc=task.redTaskReviw.redDescription
            goingRedTask.deadline=task.redTaskReviw.redDeadline
            goingRedTask.lastRedactTime=task.redTaskReviw.redDate
        },
    }

})



Vue.component('note', {
    props: {
        column: {
            type: Array,
            required: true,

        },
        errors: {
            type: Array,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        columnIndex: {
            type: Number,
            required: true
        },
    },


    template: `
        <div>
            <p>{{ name }}</p>
            <div class="note">
                <ul>
                    <li v-for="(note, indexNote) in column" class="li-list" >
                        <div class="all">
                                
                                    <h1>{{ note.gg }}</h1>
                            <div class="main">
                                <h2>{{ note.name }}</h2>
                                <p><b>Описание: </b>{{ note.desc }}</p>
                                <p><b>Начало: </b>{{ note.date }}</p>
                                <p><b>Дэдлайн: </b>{{ note.deadline }}</p>
                                <p v-if="note.lastRedactTime">Отредактировано: {{note.lastRedactTime}}</p>
                                <p v-for="error in errors"> {{ error }}</p>
                                <p v-if="note.reason !== null" v-for="q in note.reason"><b>Причина: </b>{{ q }}</p>
                                <button v-show="columnIndex !== 3" @click="nextColumn(columnIndex, indexNote, name)">Далее</button>
                                <button v-show="columnIndex === 0" @click="deleteTask(columnIndex, indexNote, name)">Удалить</button>
                                <button v-show="columnIndex === 2" @click="reasonStatusEdit(columnIndex, indexNote, name, note)">Вернуть</button>
                                <button v-show="columnIndex !== 3" @click="redactTask(columnIndex, indexNote, name)">Редактировать</button>
                            </div>
                        </div>
                        <form v-show="note.reasonStatus === true" @submit.prevent="reasonBackFun(reasonBack, columnIndex, indexNote, note)">
                            <input type="text" v-model="reasonBack" placeholder="Причина" required>
                            <input type="submit">
                        </form>
                        <form  v-show="note.editStatus === true" @submit.prevent="onSubmit(columnIndex, indexNote)">
                                <input required id="redName" v-model="redName" type="text" placeholder="Название">
                                <input id="redDescription" v-model="redDescription" type="text" placeholder="Описание">
                                <input id="redDeadline" v-model="redDeadline" type="date">
                                <input type="submit" value="Редактировать">
                            </form>
                    </li>
                </ul>
            </div>
        </div>
    `,


    data(){
        return{
            redName: null,
            redDescription: null,
            redDeadline: null,
            redDate: null,
            count: null,
            strDate: null,
            reason: null,
            reasonBack: null
        }
    },


    methods: {
        onSubmit(columnIndex, indexNote) {
            this.redDateTask()
            redTaskReview = {
                redName: this.redName,
                redDescription: this.redDescription,
                redDeadline: this.redDeadline,
                redDate: this.redDate
            }
            this.$emit('redSub', {redTaskReview, columnIndex, indexNote})
            this.redName = null
            this.redDescription = null
            this.redDeadline = null
            this.redDate = null
        },
        redDateTask(){
            let date = new Date()
            let year = date.getFullYear()
            let month = date.getMonth()+1
            let day = date.getDate()
            this.redDate = year + '-' + month + '-' + day
        },
        redactTask(columnIndex, indexNote, name) {
            this.$emit('redactTask', {columnIndex, indexNote, name})
        },
        deleteTask(columnIndex, indexNote, name){
            this.$emit('deleteTask', {columnIndex, indexNote, name})
        },
        nextColumn(columnIndex, indexNote, name){
            this.$emit('nextColumn', {columnIndex, indexNote, name})
        },
        reasonStatusEdit(columnIndex, indexNote, name, note){
            this.$emit('reasonStatusEdit', {columnIndex, indexNote, name, note})
        },
        reasonBackFun(reasonBack, columnIndex, indexNote, note){
            console.log("note", note)
            this.$emit('reasonBackFun', {reasonBack, columnIndex, indexNote, note})
        },
        editStatus(columnIndex, indexNote, note){
            this.$emit('editStatus', {columnIndex, indexNote, note})
        }
    },
})



Vue.component('create-note', {
    template: `
        <div class="createNote">
            <form class="createForm" @submit.prevent="onSubmit">
                 
                <p v-if="errors" v-for="error in errors">{{ error }}</p>
                <input type="text" placeholder="Название" id="name" v-model="name" required maxlength="10">
                <input type="text" placeholder="Описание" id="desc" v-model="desc" required>
                <input type="date" id="date" v-model="deadline" required>
                <input type="submit" value="Создать">
            </form>
        </div>  
    `,


    data() {
        return{
            name: null,
            desc: null,
            date: null,
            deadline: null,
            reasonStatus: false,
            reason: [],
            errors: [],
            gg: null,
            errorGG: [],
            id: null,
            editStatus: false
        }
    },
    computed: {
    },

    methods: {
        onSubmit() {
            this.dateAdd()
            let note = {
                name: this.name,
                desc: this.desc,
                date: this.date,
                editStatus: this.editStatus,
                reasonStatus: this.reasonStatus,
                timeForRedact: false,
                lastRedactTime: null,
                deadline: this.deadline,
                reason: this.reason,
                gg: this.gg,
                errorGG: this.errorGG,
                id: this.id
            }
            eventBus.$emit('notes-submitted', note);
            this.name = null;
            this.desc = null;
            this.date = null
            this.deadline = null
        },
        idUp(){
            this.id++
        },


        dateAdd(){
            let date = new Date()
            let year = date.getFullYear()
            let month = date.getMonth()+1
            let day = date.getDate()
            let time = date.toLocaleTimeString()
            this.date = year + '-' + month + '-' + day
        },
    },
})



let app = new Vue({
    el: '#app',
    data: {
        name: 'Notes',
    }
})
