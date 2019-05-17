<template>
  <div class="preview border">
    <div class="preview-cover" @click="toArticle">
      <img class="preview-cover-img" :src="article.cover" alt="">
      <h3 class="preview-cover-title">{{article.title}}</h3>
    </div>

    <div class="preview-info">
      <span class="preview-info-date">
        <i class="far fa-clock"></i>
        {{article.date}}
      </span>
      <span v-for="label in article.labels" :key="label.name" class="preview-info-label" :style="`background: #${label.color}`">
        {{label.name}}
      </span>
    </div>

    <div class="preview-content" v-html="articlePreview"></div>

    <div class="preview-tools">
      <i class="far fa-thumbs-up" :class="{'fas praised': hasPraised.length}" @click="$emit('praise', { number: article.number, hasPraised })"></i>
      {{article.reactions.praise.length}}
      <i class="far fa-heart" :class="{'fas liked': hasLiked.length}" @click="$emit('like', { number: article.number, hasLiked })"></i>
      {{article.reactions.like.length}}
      <i class="far fa-comment-dots" @click="$emit('toComment', article.number)"></i>
      {{article.commentsAmount}}
    </div>
  </div>
</template>

<script>
import marked from 'marked'
import hljs from 'highlight.js'

marked.setOptions({
  highlight: function (code, lang) {
    let val = code
    if (lang) {
      val = hljs.highlight(lang, code).value
    }
    return val
  },
  sanitize: true
})

export default {
  props: ['article', 'userInfo'],
  computed: {
    articlePreview () {
      const content = this.article.content.replace(/!\[.+?\]\(.+?\)/, '')
      return marked(content).match(/<p>(.*?)<\/p>/)[1]
    },
    hasLiked () {
      return this.article.reactions.like.filter(({ user }) => {
        return user.login === this.userInfo.login
      })
    },
    hasPraised () {
      return this.article.reactions.praise.filter(({ user }) => {
        return user.login === this.userInfo.login
      })
    }
  },
  methods: {
    toArticle () {
      this.$emit('toArticle', this.article.number)
    }
  }
}
</script>

<style lang="less" scoped>
@import '../assets/style/variables.less';

.preview {
  overflow: hidden;
  margin-bottom: calc(@gapOuter * 3);
  background: #fff;
  &-cover {
    height: 40vh;
    display: flex;
    flex-direction: column-reverse;
    position: relative;
    &-img {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
    }
    &-title {
      position: relative;
      z-index: 10;
      margin: 0;
      padding: @gapOuter;
      background: rgba(0, 0, 0, .3);
      color: #fff;
      font-weight: normal;
    }
  }
  &-info {
    padding: @gapInner 0;
    margin: 0 @gapOuter;
    color: @monorFontColor;
    border-bottom: 1px solid @thirdBorderColor;
    &-label {
      margin-left: @gapInner;
      padding: 2px @gapInner;
      color: #fff;
      border-radius: 3px;
    }
  }
  &-tools {
    padding: @gapOuter;
    padding-top: 0;
    color: @monorFontColor;
    text-align: right;
    i {
      padding-left: @gapOuter;
      cursor: pointer;
      font-size: 1.2rem;
      &.praised {
        color: @warningColor;
      }
      &.liked {
        color: @dangerColor;
      }
    }
  }
  &-content {
    padding: @gapOuter;
    color: @regularFontColor;
  }
}

@media only screen and (max-width: 450px) {
  .preview {
    border-radius: 0;
    border-right: 0;
    border-left: 0;
    margin-bottom: calc(@gapOuter * 2);
  }
}
</style>
