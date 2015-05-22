#!/bin/sh
# /etc/init.d/subnodes_fileshare
# starts samba service

NAME=subnodes_fileshare
DESC="Brings up samba server or connection to remote samba share."
DAEMON_PATH="/home/pi/subnodes-fileshare"
DAEMONOPTS="sudo nodemon ./app/server/server"

PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME
ISSERVER=0
HASMOUNT=0

	case "$1" in
		start)
			echo "Starting samba..."
			# start the samba service if we are a server
			[[ $ISSERVER = true ]] && service samba start
			# mount the file share if we have a mount point
			[[ $HASMOUNT = true ]] && mount SHARE MOUNT -o guest
			# start the node.js chat application
			cd $DAEMON_PATH
			PID=`$DAEMONOPTS > /dev/null 2>&1 & echo $!`
			#echo "Saving PID" $PID " to " $PIDFILE
				if [ -z $PID ]; then
					printf "%s\n" "Fail"
				else
					echo $PID > $PIDFILE
					printf "%s\n" "Ok"
				fi
			;;
		status)
			printf "%-50s" "Checking $NAME..."
			if [ -f $PIDFILE ]; then
				PID=`cat $PIDFILE`
				if [ -z "`ps axf | grep ${PID} | grep -v grep`" ]; then
					printf "%s\n" "Process dead but pidfile exists"
				else
					echo "Running"
				fi
			else
				printf "%s\n" "Service not running"
			fi
		;;
		stop)
			printf "%-50s" "Shutting down $NAME…"
				PID=`cat $PIDFILE`
				cd $DAEMON_PATH
			if [ -f $PIDFILE ]; then
				kill -HUP $PID
				printf "%s\n" "Ok"
				rm -f $PIDFILE
			else
				printf "%s\n" "pidfile not found"
			fi
			service samba stop
		;;

		restart)
			$0 stop
			$0 start
		;;

*)
		echo "Usage: $0 {status|start|stop|restart}"
		exit 1
esac
