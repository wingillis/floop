<template lang="pug">
tr.shade
  td {{ pdf.title }}
  td {{ pdf.journal }}
  td {{ authors }}
  //- tag section
  td(v-on:dblclick="edit")
    div(v-if="editing")
      textarea#tagedit(v-model="tags", v-on:keydown.enter="saveTag", cols=9)
    div(v-else) {{ tags }}
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'pdf-file',
  props: ['pdf'],
  data () {
    return {
      editing: false,
      tagVar: this.pdf.tags.slice()
    }
  },
  computed: {
    authors () {
      let authors = this.pdf.authors
      if (authors != null) {
        return authors.map((v) => { return v.family }).join(', ')
      } else {
        return ''
      }
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
    edit () {
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
    ])
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
