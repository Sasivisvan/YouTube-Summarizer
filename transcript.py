from youtube_transcript_api import YouTubeTranscriptApi
import sys

video_id = sys.argv[1]  

ytt_api = YouTubeTranscriptApi()
transcript = ytt_api.fetch(video_id)
for i in transcript:
    print(i.text,end=" ")
