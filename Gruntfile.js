module.exports = function(grunt) {
  grunt.initConfig({
    browserify: {
      basic: {
        src:['src/*.js'],
        dest: 'minicraft.js', 
        options: {
          debug: true
        },
      }
    },
    watch: {
      files: ['src/*.js'],
      tasks: ['default']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.registerTask('default', ['browserify']);
};
