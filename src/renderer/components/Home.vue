<template lang="pug">
  div
    h1 {{ thing }}  
</template>

<script>

export default {
  name: 'home',
  data () {
    return {
      thing: 'ready?'
    }
  },
  mounted: function () {
    const vue = this
    this.$electron.ipcRenderer.on('on-load-db', (event, args) => {
      vue.thing = 'loaded!'
    })
    this.$electron.ipcRenderer.send('load-db')
  }
}
</script>
