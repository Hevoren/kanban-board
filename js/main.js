let eventBus = new Vue()

Vue.component('all-notes', {
    template:`
            <div class="all-notes">
                <create-note></create-note>
                <notes></notes>
            </div>
    `,
})

Vue.component('notes', {
    template: `
        <div class="notes">
            <note :column="columns[0]" :errors="errors" :name="nameFirst"   :columnIndex="columnIndex1" @deleteTask="deleteTask" @nextColumn="nextColumn"       @editTask="editTask"></note>
            <note :column="columns[1]" :errors="errors" :name="nameSecond"  :columnIndex="columnIndex2" @nextColumn="nextColumn" @clearTrues="clearTrues"></note>
            <note :column="columns[2]" :errors="errors" :name="nameThird"   :columnIndex="columnIndex3" @nextColumn="nextColumn" @reasonBackFun="reasonBackFun" @reasonStatusEdit="reasonStatusEdit"></note>
            <note :column="columns[3]" :errors="errors" :name="nameFourth"  :columnIndex="columnIndex4" :gg="gg" :errorGG="errorGG"></note>
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

            gg: [],
            errorGG: [],
        }
    },

    mounted(){
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
        eventBus.$on('endColumn', () => {
            this.columns[3].forEach(note => {
                if (note){
                    if (note.date <= note.deadline){
                        this.gg.push("GG")
                    }else{
                        this.errorGG.push("GABELLA")
                    }
                }
            })
        })
    },
    watch: {
        columns: {
            handler: 'saveNotes',
            deep: true
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

            console.log(this.columns[task.columnIndex][task.indexNote].date,'-', this.columns[task.columnIndex][task.indexNote].deadline)
            console.log(typeof (this.columns[task.columnIndex][task.indexNote].date),'-', typeof (this.columns[task.columnIndex][task.indexNote].deadline))
            let move = this.columns[task.columnIndex].splice(task.indexNote, 1)
            this.columns[task.columnIndex+1].push(...move)
        },

        editTask(task){

        },

        reasonStatusEdit(task){
            this.columns[task.columnIndex][task.indexNote].reasonStatus = !this.columns[task.columnIndex][task.indexNote].reasonStatus

        },
        reasonBackFun(task){
            this.columns[2][task.indexNote].reason = task.reasonBack
            let move = this.columns[2].splice(task.indexNote, 1)
            this.columns[1].push(...move)

            this.clearTrues()
        },
        clearTrues(task){
            eventBus.$emit('clear-trues', task)
        }
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
        gg: {
            type: Array,
            required: false
        },
        errorGG: {
            type: Array,
            required: false
        }
    },

    template: `
        <div>
            <p>{{ name }}</p>
            <div class="note">
                <ul>
                    <li v-for="(note, indexNote) in column" class="li-list" >
                        <h1>{{ gg }}</h1>
                        <h2>{{ note.name }}</h2>
                        <p><b>Описание: </b>{{ note.desc }}</p>
                        <p><b>Начало: </b>{{ note.date }}</p>
                        <p><b>Дэдлайн: </b>{{ note.deadline }}</p>
                        <p v-if="note.reasonStatus === false"><b>reasonStatus: </b>{{ note.reasonStatus }}</p>
                        
                        <p v-for="error in errors"> {{ error }}</p>
                        <p v-if="note.reason !== null"><b>Причина: </b>{{ note.reason }}</p>
                        <button v-show="columnIndex === 0" @click="deleteTask(columnIndex, indexNote, name)">Удалить</button>
                        <button v-show="columnIndex !== 3" @click="nextColumn(columnIndex, indexNote, name)">Далее</button>
                        <button v-show="columnIndex !== 3" @click="editTask(columnIndex, indexNote, name)">Редактировать</button>
                        <button v-show="columnIndex === 2" @click="reasonStatusEdit(columnIndex, indexNote, name, note)">Вернуть</button>
                        <form v-show="note.reasonStatus === true" @submit.prevent="reasonBackFun(reasonBack, columnIndex, indexNote)">
                            <input type="text" v-model="reasonBack" placeholder="Причина" required>
                            <input type="submit">
                        </form>
                        
                    </li>
                </ul>
            </div>
        </div>
    `,

    data(){
        return{
            reasonBack: null
        }
    },

    methods: {
        deleteTask(columnIndex, indexNote, name){
            this.$emit('deleteTask', {columnIndex, indexNote, name})
        },
        nextColumn(columnIndex, indexNote, name){
            this.$emit('nextColumn', {columnIndex, indexNote, name})
        },
        editTask(columnIndex, indexNote, name){
            this.$emit('editTask', columnIndex, indexNote, name)
        },
        backTask(columnIndex, indexNote, name){
            this.$emit('backTask', columnIndex, indexNote, name)
        },
        reasonStatusEdit(columnIndex, indexNote, name, note){
            this.$emit('reasonStatusEdit', {columnIndex, indexNote, name, note})
        },
        reasonBackFun(reasonBack, columnIndex, indexNote){
            this.$emit('reasonBackFun', {reasonBack, columnIndex, indexNote})
        },

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
                
                <button type="submit">Create</button>
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
            reason: null,
            id: 0,
            errors: [],
        }
    },

    methods: {
        onSubmit() {
            this.dateAdd()
            let note = {
                name: this.name,
                desc: this.desc,
                date: this.date,
                editStatus: false,
                reasonStatus: this.reasonStatus,
                deadline: this.deadline,
                reason: this.reason
            }
            eventBus.$emit('notes-submitted', note);
            this.name = null;
            this.desc = null;
            this.date = null
            this.deadline = null
        },

        dateAdd(){
            let date = new Date()
            let year = date.getFullYear()
            let month = date.getMonth()+1
            let day = date.getDate()
            let time = date.toLocaleTimeString()
            let dateline = year + '-' + month + '-' + day
            this.date = dateline
        },
    },


})

let app = new Vue({
    el: '#app',
    data: {
        name: 'Notes',
    }
})