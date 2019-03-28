<template lang="pug">
//- reference for the context menu: https://github.com/rawilk/vue-context
tr.shade(@contextmenu.prevent="$refs.menu.open")
  td(v-on:dblclick="open")
    div(v-if="editTitleState")
      textarea#title-edit(v-model="title", v-on:keydown.enter="updateTitle", cols=30, rows=3)
    div(v-else) {{ pdf.title }}
  td {{ pdf.journal }}
  td {{ authors }}
  //- tag section
  td(v-on:dblclick="editTag")
    div(v-if="editing")
      textarea#tagedit(v-model="tags", v-on:keydown.enter="saveTag", cols=12)
    div(v-else) {{ tags }}
  vue-context(ref="menu")
    ul
      li(@click="editTitle") Edit title
      li(@click="editTag") Edit tags
</template>

<script>
import { mapActions } from 'vuex'
import { ipcRenderer } from 'electron'
import { VueContext } from 'vue-context'

export default {
  components: {
    VueContext
  },
  name: 'pdf-file',
  props: ['pdf'],
  data () {
    return {
      editing: false,
      editTitleState: false,
      tagVar: this.pdf.tags.slice(),
      title: this.pdf.title
    }
  },
  computed: {
    authors () {
      let retval = ''
      let authors = this.pdf.authors
      if (authors == null) return retval

      if (authors.length > 5) {
        authors = [authors[0], authors[1], authors[authors.length - 1]]
        retval = authors.map(v => { return v.family })
        retval.splice(2, 0, '...')
        retval = retval.join(', ')
      } else {
        retval = authors.map(v => { return v.family }).join(', ')
      }
      return retval
    },
    tags: {
      get () {
        return this.tagVar.join(', ')
      },
      set (newval) {
        this.tagVar = newval.split(', ')
      }
    }
  },
  methods: {
    open () {
      ipcRenderer.send('open', this.pdf.path)
    },
    editTag () {
      this.editing = true
      this.$nextTick(() => {
        document.getElementById('tagedit').focus()
        document.getElementById('tagedit').select()
      })
    },
    saveTag () {
      this.editing = false
      // send event to main process to update the database
      this.updatePdf({'pdf': this.pdf, 'tags': this.tagVar})
    },
    ...mapActions([
      'updatePdf'
    ]),
    editTitle () {
      this.editTitleState = true
      this.$nextTick(() => {
        document.getElementById('title-edit').focus()
        document.getElementById('title-edit').select()
      })
    },
    updateTitle () {
      this.editTitleState = false
      if (this.title != null && this.title !== '') {
        let title = this.title.replace('\n', ' ')
        this.updatePdf({pdf: this.pdf, title: title})
      }
    }
  }
}
</script>

<style lang="scss">
.shade {
  transition-duration: 0.3s;
  transition-property: background-color;

}
.shade:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

textarea {
 border: 0px;
 outline: none;
 resize: none;
}
</style>
