<template lang="pug">
div
  p {{ pdf.title }}
  p {{ pdf.journal }}
  p {{ pdf.authors }}
  p {{ pdf.tags }}
</template>

<script>
export default {
  name: 'pdf-file',
  props: ['pdf']
}
</script>
