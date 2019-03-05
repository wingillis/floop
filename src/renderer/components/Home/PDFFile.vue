<template lang="pug">
tr.shade
  td {{ pdf.title }}
  td {{ pdf.journal }}
  td {{ authors }}
  td {{ pdf.tags.join(', ')}}
</template>

<script>
export default {
  name: 'pdf-file',
  props: ['pdf'],
  computed: {
    authors () {
      return this.pdf.authors.map((v) => { return v.family }).join(', ')
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
    background-color: rgba(0, 0, 0, 0.06)

  }
</style>
