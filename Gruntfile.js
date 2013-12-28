module.exports = function(grunt) {
  grunt.initConfig({
    concat_sourcemap: {
      options: {
        seperator:'\n;;'
      },
      dist: {
        files: {
          'minicraft.js': ['src/*.js']
        }
      }
    },
    watch: {
      files: ['src/*.js'],
      tasks: ['default']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concat-sourcemap');
  grunt.registerTask('default', ['concat_sourcemap']);
};
