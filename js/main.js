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
            <note :column="columns[0]" :errors="errors_1" :name="nameFirst" @deleteTask="deleteTask" @nextColumn="nextColumn" @editTask="editTask" :columnIndex="columnIndex1"></note>
            <note :column="columns[1]" :errors="errors_2" :name="nameSecond" @nextColumn="nextColumn" :columnIndex="columnIndex2"></note>
            <note :column="columns[2]" :errors="errors_3" :name="nameThird" @nextColumn="nextColumn" @reasonBackFun="reasonBackFun" @reasonStatusEdit="reasonStatusEdit" :columnIndex="columnIndex3" ></note>
            <note :column="columns[3]" :errors="errors_4" :name="nameFourth" :columnIndex="columnIndex4"></note>
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

            errors_1: [],
            errors_2: [],
            errors_3: [],
            errors_4: [],

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
    // mounted - вызывается после того, как компонент был добавлен в DOM, т.е. србатывает после того как даннные улетели из формы сюда.
    // после чего он пытается достать и разобрать строку json из localstorage, и если ее нет, присваивает пустой массив
    mounted(){

        const savedColumns = localStorage.getItem('columns');
        if (savedColumns) {
            this.columns = JSON.parse(savedColumns);
        }
        eventBus.$on('notes-submitted', note => {
            this.columns[0].push(note);
            this.saveNotes();
        });
    },
    // watch отслеживает изменения, если они есть, то он присваивает и сохраняет новые значения, добавляя их в localstorage и преобразовывая ('stringify') в json формат
    watch: {


        columns: {
            handler: 'saveNotes',
            deep: true
        },
    },
    computed: {
        isFirstColumnBlocked() {
            return this.columns[1].length === 5;
        },
    },
    // saveNote вызывается после выполнения mounted; присваивает и сохраняет значения в localstorage, преобразовывая ('stringify') их в json формат
    methods: {
        saveNotes() {
            localStorage.setItem('columns', JSON.stringify(this.columns));
        },

        getIndex(task) {
            let tasking = this.columns[task.columnIndex][task.indexNote]
            this.changeTask(tasking, task)
        },

        deleteTask(task){
            this.columns[task.columnIndex].splice(task.indexNote, 1)
        },

        nextColumn(task) {
            console.log("ДАЛЕЕЕ", task)
            let move = this.columns[task.columnIndex].splice(task.indexNote, 1)
            this.columns[task.columnIndex+1].push(...move)
        },

        editTask(task){

        },

        reasonStatusEdit(task){
            console.log(task)
            this.columns[task.columnIndex][task.indexNote].reasonStatus = !this.columns[task.columnIndex][task.indexNote].reasonStatus
        },
        reasonBackFun(task){
            console.log("sadas: ", task)
            this.columns[2][task.indexNote].reason = task.reasonBack
            let move = this.columns[2].splice(task.indexNote, 1)
            this.columns[1].push(...move)
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

    },

    template: `
        <div>
            <p>{{ name }}</p>
            <div class="note">
                <h1 v-for="error in errors"> {{ error }}</h1>
                <ul>
                    <li v-for="(note, indexNote) in column" class="li-list" >
                        <h1>{{ note.name }}</h1>
                        <p>Описание: {{ note.desc }}</p>
                        <p>Начало: {{ note.date }}</p>
                        <p>Дэдайн: {{ note.deadline }}</p>
                        <p>{{ note.reasonStatus }}</p>
                        
                        <button v-show="columnIndex === 0" @click="deleteTask(columnIndex, indexNote, name)">Удалить</button>
                        <button v-show="columnIndex !== 3" @click="nextColumn(columnIndex, indexNote, name)">Далее</button>
                        <button v-show="columnIndex !== 3" @click="editTask(columnIndex, indexNote, name)">Редактировать</button>
                        <button v-show="columnIndex === 2" @click="reasonStatusEdit(columnIndex, indexNote, name, note)">Вернуть</button>
                        <form v-show="note.reasonStatus === true" @submit.prevent="reasonBackFun(reasonBack, columnIndex, indexNote, name)">
                            <input type="text" v-model="reasonBack" placeholder="Причина">
                            <input type="submit">
                        </form>
                        <p>{{ note.reason }}</p>
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
        reasonBackFun(reasonBack, columnIndex, indexNote, name){
            console.log(reasonBack)
            this.$emit('reasonBackFun', {reasonBack, columnIndex, indexNote, name})
            note.reasonStatus = false
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
            let dateline = year + '-' + month + '-' + day + '  ' + time
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