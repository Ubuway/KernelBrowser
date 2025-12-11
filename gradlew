#!/usr/bin/env sh

##############################################################################
##
##  Gradle start up script for UN*X
##
##############################################################################

# Attempt to set APP_HOME
# Resolve links: $0 may be a link
PRG="$0"
# Need this for relative symlinks.
while [ -h "$PRG" ] ; do
    ls=`ls -ld "$PRG"`
    link=`expr "$ls" : '.*-> \(.*\)$'`
    if expr "$link" : '/.*' > /dev/null; then
        PRG="$link"
    else
        PRG=`dirname "$PRG"`"/$link"
    fi
done
SAVED="`pwd`"
cd "`dirname \"$PRG\"`/" >/dev/null
APP_HOME="`pwd -P`"
cd "$SAVED" >/dev/null

APP_NAME="Gradle"
APP_BASE_NAME=`basename "$0"`

# Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD="maximum"

warn () {
    echo "$*"
}

die () {
    echo
    echo "$*"
    echo
    exit 1
}

# OS specific support (must be 'true' or 'false').
cygwin=false
msys=false
darwin=false
nonstop=false
case "`uname`" in
  CYGWIN* )
    cygwin=true
    ;;
  Darwin* )
    darwin=true
    ;;
  MINGW* )
    msys=true
    ;;
  NONSTOP* )
    nonstop=true
    ;;
esac

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses strange locations for the exec function
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME"
    fi
else
    JAVACMD="java"
    which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH."
fi

# Increase the maximum file descriptors if we can.
if [ "$cygwin" = "false" ] && [ "$darwin" = "false" ] && [ "$nonstop" = "false" ] ; then
    MAX_FD_LIMIT=`ulimit -H -n`
    if [ "$?" = "0" ] ; then
        if [ "$MAX_FD" = "maximum" ] || [ "$MAX_FD" = "max" ] ; then
            MAX_FD="$MAX_FD_LIMIT"
        fi
        ulimit -n "$MAX_FD"
        if [ "$?" != "0" ] ; then
            warn "Could not set maximum file descriptor limit: $MAX_FD"
        fi
    else
        warn "Could not query maximum file descriptor limit: $MAX_FD_LIMIT"
    fi
fi

# For Darwin, add options to specify how the application appears in the dock
if $darwin; then
    GRADLE_OPTS="$GRADLE_OPTS \"-Xdock:name=$APP_NAME\" \"-Xdock:icon=$APP_HOME/media/gradle.ico\""
fi

# For Cygwin, switch paths to Windows format before running java
if $cygwin ; then
    APP_HOME=`cygpath --path --mixed "$APP_HOME"`
    CLASSPATH=`cygpath --path --mixed "$CLASSPATH"`
    JAVACMD=`cygpath --unix "$JAVACMD"`

    # We build the pattern for arguments to be converted via cygpath
    ROOTDIRSRAW=`find -L / -maxdepth 1 -mindepth 1 -type d 2>/dev/null`
    SEP=""
    for dir in $ROOTDIRSRAW ; do
        ROOTDIRS="$ROOTDIRS$SEP$dir"
        SEP="|"
    done
    OURCYGPATTERN="(^($ROOTDIRS))"
    # Add a user-defined pattern to the cygpath arguments
    if [ "$GRADLE_CYGPATTERN" != "" ] ; then
        OURCYGPATTERN="$OURCYGPATTERN|($GRADLE_CYGPATTERN)"
    fi
    if [ "$OURCYGPATTERN" = "" ] ; then
        CCAPP_HOME=`cygpath --path --mixed "$APP_HOME"`
    else
        CCAPP_HOME=`cygpath --path --mixed --ignore-case "$APP_HOME"`
    fi
    
    JAVACMD=`cygpath --unix "$JAVACMD"`

    # Now convert the arguments
    for i do
        arg=`echo "$i" | sed "s|^$OURCYGPATTERN||"`
        if echo "$i" | grep -q "|" ; then
            arg=`echo "$i" | sed "s|^$OURCYGPATTERN|$CCAPP_HOME|"`
        fi
        if [ -z "$arg" ] ; then
            arg="$i"
        fi
        case $arg in
          -*) die "Unknown option: $arg" ;;
          * ) set -- "$@" "$arg" ;;
        esac
    done
fi

# Split up the JVM parameters
JVM_OPTS=()
GRADLE_PARAMS=()
# Separate jvm and gradle parameters
for param in "$@" ; do
    is_jvm_param=false
    for jvm_param in -D -X -XX ; do
        case "$param" in
          "$jvm_param"* ) is_jvm_param=true ; break ;;
        esac
    done
    if $is_jvm_param ; then
        JVM_OPTS+=("$param")
    else
        GRADLE_PARAMS+=("$param")
    fi
done

# Collect all arguments for the java command;
#   * $DEFAULT_JVM_OPTS, $JAVA_OPTS, and $GRADLE_OPTS can contain fragments of
#     shell script including quotes and variable substitutions, so put them in
#     double quotes to make sure that they get re-expanded; and
#   * put everything else in single quotes, so that it's not re-expanded.
set -- \
        "-Dorg.gradle.appname=$APP_BASE_NAME" \
        ${JVM_OPTS[@]} \
        -classpath "$CLASSPATH" \
        org.gradle.wrapper.GradleWrapperMain \
        ${GRADLE_PARAMS[@]}

# Stop when "xargs" is not available.
if ! command -v xargs >/dev/null 2>&1; then
    die "xargs is not available"
fi

# Use "xargs" to parse quoted args.
#
# With -n1 it outputs one arg per line, with the quotes and backslashes removed.
#
# In Bash you could simply go:
#
#   readarray ARGS < <( xargs -n1 <<<"$var" ) &&
#   set -- "${ARGS[@]}" "$@"
#
# but unfortunately the POSIX shell does not have this capability.
eval "set -- $(
        printf '%s\n' "$*" |
            xargs -n1 |
            sed ' s~[^-[:alnum:]+,./:=@_]~\\&~g; ' |
            tr '\n' ' '
    )" '"$@"'

exec "$JAVACMD" "$@"
