FROM ruby:2.6-alpine

RUN apk add --update build-base postgresql-dev tzdata
RUN gem install rails --pre

