require 'sinatra'

set bind: "0.0.0.0"

set :public_folder, '.'

get '/' do
  redirect to("/index.html")
end